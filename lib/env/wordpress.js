/**
 * External dependencies
 */
const dockerCompose = require( 'docker-compose' );
const { join } = require( 'path' );

/**
 * Internal dependencies
 */
const { info, code } = require( './log' );
const { availableOptions } = require( './config' );
const output = require( './output' );

const wpCliConfigHas = 'wp config has';
const wpCliConfigDelete = 'wp config delete';
const wpCliRewriteStructure = 'wp rewrite structure';
const wpCliEvalFile = 'wp eval-file';

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
 * @typedef {'development'|'tests'} WPEnvironment
 */

/**
 * Configures WordPress for the given environment by installing WordPress,
 * activating all plugins, and activating the first theme. These steps are
 * performed sequentially so as to not overload the WordPress instance.
 *
 * @param {WPEnvironment} environment The environment to configure. Either 'development' or 'tests'.
 * @param {WPConfig}      config      The wp-env config object.
 * @param {Object}        spinner     A CLI spinner which indicates progress.
 */
async function configureWordPress( environment, config, spinner ) {
	//output(`Setting WordPress ${environment} Environment Variables`, spinner);
	spinner.text = `Setting WordPress ${ environment } Environment Variables`;
	const pre = environment !== 'development' ? 'tests-' : '';
	const dockerComposeConfig = {
		config: [
			join( config.workDirectoryPath, 'docker-compose.yml' ),
			join( config.workDirectoryPath, 'docker-compose.override.yml' ),
		],
		log: config.debug,
	};
	let isMultisite = false;
	let isSubdomain = false;
	let permalinkChange = false;
	let envVars = '';
	const cmd = `${ wpCliEvalFile } ./wp-caweb.php`;

	output( `Gathering ${ environment } environment variables...`, spinner );
	for ( let [ key, value ] of Object.entries(
		config.env[ environment ].config
	) ) {
		value = typeof value === 'string' ? `"${ value }"` : value;

		if ( 'WP_MULTI_SITE' === key && true === value ) {
			isMultisite = true;
		}

		if ( 'WP_SUBDOMAIN' === key && true === value ) {
			isSubdomain = true;
		}

		if ( 'WP_PERMALINK' === key ) {
			permalinkChange = true;
		}

		envVars += `${ key }=${ value } `;
	}

	// convert to multisite
	if ( isMultisite ) {
		output( 'Configuring WordPress...', spinner );
		const network = isSubdomain ? '--subdomains' : '';

		await dockerCompose.run(
			`${ pre }cli`,
			[ 'bash', '-c', `wp core multisite-convert ${ network }` ],
			dockerComposeConfig
		);
	}

	// rewrite permalink structure
	if ( permalinkChange ) {
		output(
			`Rewriting ${ environment } Environment Permalink Structure...`,
			spinner
		);
		const permalink = config.env[ environment ].config.WP_PERMALINK;

		await dockerCompose.run(
			`${ pre }cli`,
			[
				'bash',
				'-c',
				`${ wpCliRewriteStructure } ${ permalink } ${
					isMultisite ? '--hard' : ''
				}`,
			],
			dockerComposeConfig
		);
	}

	// clean up wp-config.php
	output( `Cleaning ${ environment } wp-config.php...`, spinner );
	const deleteChanges = [];
	availableOptions.map( ( key ) => {
		deleteChanges.push(
			`${ wpCliConfigHas } ${ key } && ${ wpCliConfigDelete } ${ key }`
		);

		return true;
	} );
	/* eslint-disable */
	await dockerCompose
		.run(
			`${ pre }cli`,
			[ 'bash', '-c', `${ deleteChanges.join( ' || ' ) }` ],
			dockerComposeConfig
		)
		.then(
			( { out } ) => {
				// ignoring docker-compose command errors here, simply
				// means config variable wasn't found in wp-config.php
			},
			( { err } ) => {
				// ignoring docker-compose commands errors here, simply
				// means config variable wasn't found in wp-config.php
			}
		);
	/* eslint-enable */

	// Configuring CAWebPublishing Environment
	output(
		`Configuring CAWebPublishing ${ environment } Environment...`,
		spinner
	);
	await dockerCompose.run(
		`${ pre }cli`,
		[ 'bash', '-c', `${ cmd } cb=init_options ${ envVars }` ],
		dockerComposeConfig
	);
}

async function testCLI( environment, config, cmd ) {
	const dockerComposeConfig = {
		config: [
			join( config.workDirectoryPath, 'docker-compose.yml' ),
			join( config.workDirectoryPath, 'docker-compose.override.yml' ),
		],
		log: config.debug,
	};
	const pre = environment !== 'development' ? 'tests-' : '';

	// info(`Running the following command: ${cmd}`, spinner);
	await dockerCompose
		.run( `${ pre }cli`, [ 'bash', '-c', `${ cmd }` ], dockerComposeConfig )
		.then(
			( { exitCode, out } ) => {
				//code(`exit: ${exitCode}; stdout: ${out}`, spinner)
				code( `exit: ${ exitCode }; stdout: ${ out }` );
				//return `${out}`
			},
			( { err } ) => {
				info( `error: ${ err }` );
			}
		);

	info( 'Done!' );
}

module.exports = {
	configureWordPress,
	testCLI,
};
