#!/usr/bin/env node
/**
 * External dependencies
 */
const program = require( 'commander' );
const dockerCompose = require( 'docker-compose' );
const wpEnv = require( '@wordpress/env' );
const { didCacheChange } = require( '@wordpress/env/lib/cache' );
const md5 = require( '@wordpress/env/lib/md5' );
const { join, resolve } = require( 'path' );
const fs = require( 'fs' );
const downloadSources = require( '../download-sources' );
const { copyFile } = fs.promises;

/**
 * Internal dependencies
 */
const {
	buildWPEnv,
	buildDockerComposeOverrideConfig,
	getHomeDirectory,
} = require( '../config' );
const withSpinner = require( '../spinner' );
const { configureWordPress } = require( '../wordpress' );
const output = require( '../output' );

const description =
	'Starts a CAWeb Publishing WordPress for development on port 8000 and tests on port 8080 (override with WP_ENV_PORT in the respective config section). ' +
	"After first install, use the '--update' flag to download updates to mapped sources and to re-apply WordPress configuration options.";

program
	.command( 'start' )
	.description( description )
	.option( '--debug', 'Enable debug output.' )
	.option( '--generate', 'Generate CAWeb .wp-env.json.' )
	.option(
		'--update',
		'Download source updates and apply WordPress configuration.'
	)
	.option(
		'--xdebug',
		'Enables Xdebug. If not passed, Xdebug is turned off. If no modes are set, uses "debug". You may set multiple Xdebug modes by passing them in a comma-separated list: `--xdebug=develop,coverage`. See https://xdebug.org/docs/all_settings#mode for information about Xdebug modes.'
	)
	.option(
		'--CAWEB_ACCESS_TOKEN <value>',
		'GitHub Repository Access Token if privated.'
	)
	.option(
		'--CAWEB_TESTS_ACCESS_TOKEN <value>',
		'Test Environment GitHub Repository Access Token if privated.'
	)
	.option( '--CAWEB_COLORSCHEME <value>', 'Colorscheme.' )
	.option(
		'--CAWEB_TESTS_COLORSCHEME <value>',
		'Test Environment Colorscheme.'
	)
	.option( '--CAWEB_DESIGN_SYSTEM_ENABLED', 'Is Design System enabled.' )
	.option(
		'--CAWEB_TESTS_DESIGN_SYSTEM_ENABLED',
		'Test Environment Is Design System enabled.'
	)
	.option( '--CAWEB_FAV_ICON <value>', 'Fav Icon.' )
	.option( '--CAWEB_TESTS_FAV_ICON <value>', 'Test Environment Fav Icon.' )
	.option(
		'--CAWEB_GIT_USER <value>',
		'GitHub User where updates are received from.'
	)
	.option(
		'--CAWEB_TESTS_GIT_USER <value>',
		'Test Environment GitHub User where updates are received from.'
	)
	.option( '--CAWEB_PRIVATE_REPO', 'Is GitHub Repository private.' )
	.option(
		'--CAWEB_TESTS_PRIVATE_REPO',
		'Test Environment Is GitHub Repository private.'
	)
	.option( '--CAWEB_TEMPLATE_VER <value>', 'State Template Version.' )
	.option(
		'--CAWEB_TESTS_TEMPLATE_VER <value>',
		'Test Environment State Template Version.'
	)
	.option( '--CAWEB_VER <value>', 'CAWeb Theme Version.' )
	.option(
		'--CAWEB_TESTS_VER <value>',
		'Test Environment CAWeb Theme Version.'
	)
	.option( '--ET_API_KEY <value>', 'ElegantThemes API Key.' )
	.option(
		'--ET_TESTS_API_KEY <value>',
		'Test Environment ElegantThemes API Key.'
	)
	.option( '--ET_CLASSIC_EDITOR', 'Enable Classic Editor.' )
	.option(
		'--ET_TESTS_CLASSIC_EDITOR',
		'Test Environment Enable Classic Editor.'
	)
	.option(
		'--ET_NEW_BUILDER_EXPERIENCE',
		'Enable The Latest Divi Builder Experience.'
	)
	.option(
		'--ET_TESTS_NEW_BUILDER_EXPERIENCE',
		'Test Environment Enable The Latest Divi Builder Experience.'
	)
	.option( '--ET_PRODUCT_TOUR', 'Product Tour.' )
	.option( '--ET_TESTS_PRODUCT_TOUR', 'Test Environment Product Tour.' )
	.option( '--ET_USERNAME <value>', 'ElegantThemes Username.' )
	.option(
		'--ET_TESTS_USERNAME <value>',
		'Test Environment ElegantThemes Username.'
	)
	.option( '--PHP_VER <value>', 'PHP Version.' )
	.option( '--PHP_TESTS_VER <value>', 'Test Environment PHP Version.' )
	.option( '--WP_ENV_PORT <value>', 'Port to use for WordPress instance.' )
	.option(
		'--WP_TESTS_ENV_PORT <value>',
		'Test Environment Port to use for WordPress instance.'
	)
	.option( '--WP_HOME <value>', 'WordPress Home URL.' )
	.option( '--WP_TESTS_HOME <value>', 'Test Environment WordPress Home URL.' )
	.option( '--WP_MULTI_SITE', 'Deploy a WordPress Multisite Instance.' )
	.option(
		'--WP_TESTS_MULTI_SITE',
		'Test Environment Deploy a WordPress Multisite Instance.'
	)
	.option( '--WP_PERMALINK <value>', 'WordPress Permalink Structure.' )
	.option(
		'--WP_TESTS_PERMALINK <value>',
		'Test Environment WordPress Permalink Structure.'
	)
	.option( '--WP_SITE_TITLE <value>', 'WordPress Site Title.' )
	.option(
		'--WP_TESTS_SITE_TITLE <value>',
		'Test Environment WordPress Site Title.'
	)
	.option( '--WP_SITEURL <value>', 'WordPress Site URL.' )
	.option(
		'--WP_TESTS_SITEURL <value>',
		'Test Environment WordPress Site URL.'
	)
	.option( '--WP_SUBDOMAIN', 'If WordPress Multisite should be Subdomain.' )
	.option(
		'--WP_TESTS_SUBDOMAIN',
		'Test Environment If WordPress Multisite should be Subdomain.'
	)
	.option( '--WP_UPLOAD_FILETYPES <value>', 'WordPress Allowed Mime Types.' )
	.option(
		'--WP_TESTS_UPLOAD_FILETYPES <value>',
		'Test Environment WordPress Allowed Mime Types.'
	)
	.option( '--WP_VER <value>', 'WordPress Version.' )
	.option( '--WP_TESTS_VER <value>', 'Test Environment WordPress Version.' )
	.action( async ( options ) => {
		const override = {};

		for ( const [ key, value ] of Object.entries( options ) ) {
			if (
				! [ 'debug', 'xdebug', 'update', 'generate' ].includes( key )
			) {
				delete options[ key ];
				override[ key ] = value;
			}
		}

		options.userConfig = override;

		await withSpinner( start, options );
	} );

/**
 * Starts the development server.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner    A CLI spinner which indicates progress.
 * @param {boolean} options.debug      True if debug mode is enabled.
 * @param {boolean} options.update     If true, update sources.
 * @param {boolean} options.generate   Generate CAWeb .wp-env.json.
 * @param {string}  options.xdebug     The Xdebug mode to set.
 * @param {Object}  options.userConfig
 */
async function start( {
	spinner,
	debug,
	update,
	xdebug,
	generate,
	userConfig,
} ) {
	output( 'Creating CAWebPublishing Environment...', spinner );
	const configPath = resolve( '.wp-env.json' );
	const configHash = md5( configPath );
	const cawebConfigurator = resolve( __dirname, '../php/caweb.php' );
	const workDirectoryPath = resolve( await getHomeDirectory(), configHash );
	const shouldConfigureWp =
		update ||
		( await didCacheChange( 'config_checksum', configHash, {
			workDirectoryPath,
		} ) );
	const dockerComposeConfig = {
		config: [
			join( workDirectoryPath, 'docker-compose.yml' ),
			join( workDirectoryPath, 'docker-compose.override.yml' ),
		],
		log: debug,
	};

	output( 'Configuring .wp-env.json file...', spinner );
	const config = await buildWPEnv( { generate, userConfig } );
	config.debug = undefined === debug ? false : true;

	if (
		shouldConfigureWp &&
		fs.existsSync(
			join( workDirectoryPath, 'docker-compose.override.yml' )
		)
	) {
		// override docker services have to be shut down first
		await dockerCompose.down( {
			...dockerComposeConfig,
			commandOptions: [ '--remove-orphans' ],
		} );
	}

	output( 'Launching wp-env, this will take a few minutes...', spinner );
	await wpEnv.start( { spinner, debug, update, xdebug } );

	let startPrefixText = spinner.prefixText;
	spinner.prefixText = '';

	output( 'Configuring docker-compose.override.yml', spinner );
	await buildDockerComposeOverrideConfig( workDirectoryPath );

	output( 'Starting phpMyAdmin services', spinner );
	await dockerCompose.upMany( [ 'phpmyadmin', 'tests-phpmyadmin' ], {
		...dockerComposeConfig,
		commandOptions: shouldConfigureWp ? [ '--remove-orphans' ] : [],
	} );

	if (
		generate &&
		config.env.tests.config.WP_TESTS_DOMAIN &&
		config.env.tests.config.WP_SITEURL
	) {
		startPrefixText = startPrefixText.replace(
			/test site started at https?:\/\/localhost:\d+\//,
			config.env.tests.config.WP_SITEURL
		);
	}
	await Promise.all( [
		copyFile(
			cawebConfigurator,
			`${ workDirectoryPath }/WordPress/wp-caweb.php`
		),
		copyFile(
			cawebConfigurator,
			`${ workDirectoryPath }/tests-WordPress/wp-caweb.php`
		),
	] );

	if ( shouldConfigureWp ) {
		await downloadSources( config, spinner );

		// Configure Environment
		await Promise.all( [
			configureWordPress( 'development', config, spinner ),
			configureWordPress( 'tests', config, spinner ),
		] );
	}

	spinner.prefixText = startPrefixText;

	output( 'Done!', spinner );
}
