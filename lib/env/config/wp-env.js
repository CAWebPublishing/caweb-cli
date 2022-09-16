#!/usr/bin/env node
/**
 * External dependencies
 */
const fs = require( 'fs' );
const { resolve, join } = require( 'path' );
const { writeFile } = fs.promises;
const { readConfig } = require( '@wordpress/env/lib/config/' );
const inquirer = require( 'inquirer' );
const fetch = require( 'node-fetch' );

/**
 * Internal dependencies
 */
const Env = require( '../env' );
const { info } = require( '../log' );

/**
 * A WordPress installation, plugin or theme to be loaded into the environment.
 *
 * @typedef WPSource
 * @property {'local'|'git'|'zip'} type     The source type.
 * @property {string}              path     The path to the WordPress installation, plugin or theme.
 * @property {?string}             url      The URL to the source download if the source type is not local.
 * @property {?string}             ref      The git ref for the source if the source type is 'git'.
 * @property {string}              basename Name that identifies the WordPress installation, plugin or theme.
 */

/**
 * Base-level config for any particular environment. (development/tests/etc)
 *
 * @typedef WPServiceConfig
 * @property {WPSource}                  coreSource    The WordPress installation to load in the environment.
 * @property {WPSource[]}                pluginSources Plugins to load in the environment.
 * @property {WPSource[]}                themeSources  Themes to load in the environment.
 * @property {number}                    port          The port to use.
 * @property {Object}                    config        Mapping of wp-config.php constants to their desired values.
 * @property {Object.<string, WPSource>} mappings      Mapping of WordPress directories to local directories which should be mounted.
 * @property {string}                    phpVersion    Version of PHP to use in the environments, of the format 0.0.
 */

/**
 * wp-env configuration.
 *
 * @typedef WPConfig
 * @property {string}                           name                    Name of the environment.
 * @property {string}                           configDirectoryPath     Path to the .wp-env.json file.
 * @property {string}                           workDirectoryPath       Path to the work directory located in ~/.wp-env.
 * @property {string}                           dockerComposeConfigPath Path to the docker-compose.yml file.
 * @property {boolean}                          detectedLocalConfig     If true, wp-env detected local config and used it.
 * @property {Object.<string, WPServiceConfig>} env                     Specific config for different environments.
 * @property {boolean}                          debug                   True if debug mode is enabled.
 */

/**
 * Configures WordPress for the given environment by installing WordPress,
 * activating all plugins, and activating the first theme. These steps are
 * performed sequentially so as to not overload the WordPress instance.
 *
 * @param {Object} spinner            A CLI spinner which indicates progress.
 * @param {Object} spinner.spinner
 * @param {Object} spinner.userConfig
 */
async function buildWPEnv( { spinner, userConfig } ) {
	try {
		const configPath = resolve( '.wp-env.json' );
		const regex = /TESTS_/;
		const baseConfig = getDefaultWPEnv();

		const devConfig = {};
		const testsConfig = {};

		// separate dev and tests user options
		for ( let [ key, value ] of Object.entries( userConfig ) ) {
			// don't add port variables or actions
			if (
				[
					'WP_ENV_PORT',
					'WP_ENV_TESTS_PORT',
					'WP_ENV_TESTS_PORT',
					'DESTROY',
				].includes( key )
			) {
				continue;
			}
			// if not a test env variable
			if ( ! key.match( regex ) ) {
				// add to the dev config section
				devConfig[ key ] = value;
			} else {
				// remove the TESTS_ from the key
				key = key.replace( 'TESTS_', '' );

				// add to the test config section
				testsConfig[ key ] = value;
			}
		}
		// merge defaults with any user option overrides
		const content = {
			...baseConfig,
			env: {
				...baseConfig.env,
				development: {
					config: {
						...baseConfig.env.development.config,
						...devConfig,
					},
				},
				tests: {
					config: {
						...baseConfig.env.tests.config,
						...testsConfig,
					},
				},
			},
		};

		// iterate thru environments and apply any corrections
		for ( const [ environment, env ] of Object.entries( content.env ) ) {
			// add cookie domain if WP_SITEURL isn't http://localhost
			if (
				Object.keys( env.config ).includes( 'WP_SITEURL' ) &&
				'http://localhost' !== env.config.WP_SITEURL
			) {
				env.config.COOKIE_DOMAIN =
					'.' + env.config.WP_SITEURL.replace( /https?:\/\//, '' );
			}
			// if env aren't multisite remove the subdomain variable if it exists
			if (
				! Object.keys( env.config ).includes( 'WP_MULTI_SITE' ) &&
				Object.keys( env.config ).includes( 'WP_SUBDOMAIN' )
			) {
				delete env.config.WP_SUBDOMAIN;
			}
			// change php version if env var exists
			if ( Object.keys( env.config ).includes( 'PHP_VER' ) ) {
				if ( 'tests' !== environment ) {
					content.phpVersion = env.config.PHP_VER;
				} else {
					env.phpVersion = env.config.PHP_VER;
				}

				delete env.config.PHP_VER;
			}
			// change WP version if env var exists
			if (
				Object.keys( env.config ).includes( 'WP_VER' ) &&
				'latest' !== env.config.WP_VER
			) {
				const wpVer =
					'latest' !== env.config.WP_VER
						? `WordPress/WordPress#${ env.config.WP_VER }`
						: null;

				if ( 'tests' !== environment ) {
					content.core = wpVer;
				} else {
					env.core = wpVer;
				}

				delete env.config.PHP_VER;
			}

			if ( undefined === userConfig || ! userConfig.DESTROY ) {
				await getDiviCreds( { spinner, wpenv: env } );
			}
		}

		await writeFile( configPath, JSON.stringify( content, null, '\t' ) );

		const config = await readConfig( configPath );

		await addDivi( config );
		await addCAWeb( config );

		return config;
	} catch ( error ) {
		info( `${ error }` );
	}
}

function getDefaultWPEnv() {
	const defaultWpEnv = {
		core: `WordPress/WordPress#${ Env.wp }`,
		phpVersion: Env.php,
		plugins: [],
		themes: [],
		mappings: {},
		config: {},
		env: {
			development: {
				config: {
					...Env.development,
				},
			},
			tests: {
				config: {
					...Env.test,
				},
			},
		},
	};

	return defaultWpEnv;
}

/**
 *
 * @param {Object}   spinner         A CLI spinner which indicates progress.
 * @param {Object}   spinner.spinner
 * @param {WPConfig} spinner.wpenv
 */
async function getDiviCreds( { spinner, wpenv } ) {
	const q = [];

	// if no ET_USERNAME provided.
	if ( undefined === wpenv.config.ET_USERNAME ) {
		q.push( {
			type: 'input',
			name: 'etUser',
			message: 'ElegantThemes Acccount Username:',
		} );
	}

	// if no ET_API_KEY provided.
	if ( undefined === wpenv.config.ET_API_KEY ) {
		q.push( {
			type: 'input',
			name: 'etApiKey',
			message: 'ElegantThemes Acccount API Key:',
		} );
	}

	if ( q.length ) {
		spinner.info( 'Divi Theme information required.' );

		// if no ET creds detected prompt for the information.
		const { etUser, etApiKey } = await inquirer.prompt( q );

		if ( etUser ) {
			wpenv.config.ET_USERNAME = etUser;
		}

		if ( etApiKey ) {
			wpenv.config.ET_API_KEY = etApiKey;
		}
	}
}

async function addDivi( config ) {
	for ( const [ environment, props ] of Object.entries( config.env ) ) {
		// Add Divi theme sources if available
		if (
			undefined !== props.config.ET_USERNAME &&
			undefined !== props.config.ET_API_KEY
		) {
			const pre = 'tests' === environment ? 'tests-' : '';
			const etApiUser = props.config.ET_USERNAME;
			const etApiKey = props.config.ET_API_KEY;
			const etApi = `https://www.elegantthemes.com/api/api_downloads.php?api_update=1&theme=Divi&api_key=${ etApiKey }&username=${ etApiUser }&env=${ environment }`;

			config.env[ environment ].themeSources.push( {
				type: 'zip',
				url: etApi,
				basename: `${ pre }Divi`,
				path: resolve(
					join(
						config.workDirectoryPath,
						`/${ pre }WordPress/wp-content/themes/Divi`
					)
				),
			} );
		}
	}
}

async function addCAWeb( config ) {
	for ( const [ environment, props ] of Object.entries( config.env ) ) {
		// Add CAWeb theme sources if available
		if ( undefined !== props.config.CAWEB_VER ) {
			const pre = 'tests' === environment ? 'tests-' : '';
			const themePath = resolve(
				join(
					config.workDirectoryPath,
					`/${ pre }WordPress/wp-content/themes/CAWeb`
				)
			);
			const cawebGitUser = props.config.CAWEB_GIT_USER;
			const cawebVer = props.config.CAWEB_VER;

			const source = {
				basename: `${ pre }CAWeb`,
				type: 'zip',
				url: `https://api.github.com/repos/${ cawebGitUser }/CAWeb/zipball/${ cawebVer }`,
				path: themePath,
			};

			// get latest github release version
			if ( 'latest' === cawebVer ) {
				const latestReleaseUrl = `https://api.github.com/repos/${ cawebGitUser }/CAWeb/releases/latest`;
				const response = await fetch( latestReleaseUrl ).then(
					( fetchResponse ) => {
						return fetchResponse.json();
					}
				);

				if ( undefined !== response.zipball_url ) {
					source.url = response.zipball_url;
				}
			} else if ( ! isNaN( cawebVer.replace( /[a-zA-Z]/g, '' ) ) ) {
				// if a string was passed and not a version string
				// assume git clone of a branch
				source.type = 'git';
				source.url = `https://github.com/${ cawebGitUser }/CAWeb/`;
				source.ref = cawebVer;
				source.clonePath = themePath;

				delete source.path;
			}

			source.url += `?env=${ environment }`;
			config.env[ environment ].themeSources.push( source );
		}
	}
}

module.exports = {
	buildWPEnv,
};
