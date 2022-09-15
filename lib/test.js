#!/usr/bin/env node
/**
 * External dependencies
 */
const program = require( 'commander' );
/**
 * Internal dependencies
 */
const withSpinner = require( './spinner' );
const { buildWPEnv } = require( './env/config' );
const { testCLI } = require( './env/wordpress' );
const { info } = require( './log' );
//const { type } = require( 'os' );

program
	.command( 'test' )
	.description( 'Test Code' )
	.option( '--debug', 'Enable debug output.' )
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
		'GitHub Repository Access Token if privated.'
	)
	.option( '--CAWEB_COLORSCHEME <value>', 'Colorscheme.' )
	.option( '--CAWEB_TESTS_COLORSCHEME <value>', 'Colorscheme.' )
	.option( '--CAWEB_DESIGN_SYSTEM_ENABLED', 'Is Design System enabled.' )
	.option(
		'--CAWEB_TESTS_DESIGN_SYSTEM_ENABLED',
		'Is Design System enabled.'
	)
	.option( '--CAWEB_FAV_ICON <value>', 'Fav Icon.' )
	.option( '--CAWEB_TESTS_FAV_ICON <value>', 'Fav Icon.' )
	.option(
		'--CAWEB_GIT_USER <value>',
		'GitHub User where updates are received from.'
	)
	.option(
		'--CAWEB_TESTS_GIT_USER <value>',
		'GitHub User where updates are received from.'
	)
	.option( '--CAWEB_PRIVATE_REPO', 'Is GitHub Repository private.' )
	.option( '--CAWEB_TESTS_PRIVATE_REPO', 'Is GitHub Repository private.' )
	.option( '--CAWEB_TEMPLATE_VER <value>', 'State Template Version.' )
	.option( '--CAWEB_TESTS_TEMPLATE_VER <value>', 'State Template Version.' )
	.option( '--CAWEB_VER <value>', 'CAWeb Theme Version.' )
	.option( '--CAWEB_TESTS_VER <value>', 'CAWeb Theme Version.' )
	.option( '--ET_API_KEY <value>', 'ElegantThemes API Key.' )
	.option( '--ET_TESTS_API_KEY <value>', 'ElegantThemes API Key.' )
	.option( '--ET_CLASSIC_EDITOR', 'Enable Classic Editor.' )
	.option( '--ET_TESTS_CLASSIC_EDITOR', 'Enable Classic Editor.' )
	.option(
		'--ET_NEW_BUILDER_EXPERIENCE',
		'Enable The Latest Divi Builder Experience.'
	)
	.option(
		'--ET_TESTS_NEW_BUILDER_EXPERIENCE',
		'Enable The Latest Divi Builder Experience.'
	)
	.option( '--ET_PRODUCT_TOUR', 'Product Tour.' )
	.option( '--ET_TESTS_PRODUCT_TOUR', 'Product Tour.' )
	.option( '--ET_USERNAME <value>', 'ElegantThemes Username.' )
	.option( '--ET_TESTS_USERNAME <value>', 'ElegantThemes Username.' )
	.option( '--PHP_VER <value>', 'PHP Version.' )
	.option( '--PHP_TESTS_VER <value>', 'PHP Version.' )
	.option( '--WP_ENV_PORT <value>', 'Port to use for WordPress instance.' )
	.option(
		'--WP_TESTS_ENV_PORT <value>',
		'Port to use for WordPress instance.'
	)
	.option( '--WP_HOME <value>', 'WordPress Home URL.' )
	.option( '--WP_TESTS_HOME <value>', 'WordPress Home URL.' )
	.option( '--WP_MULTI_SITE', 'Deploy a WordPress Multisite Instance.' )
	.option( '--WP_TESTS_MULTI_SITE', 'Deploy a WordPress Multisite Instance.' )
	.option( '--WP_PERMALINK <value>', 'WordPress Permalink Structure.' )
	.option( '--WP_TESTS_PERMALINK <value>', 'WordPress Permalink Structure.' )
	.option( '--WP_SITE_TITLE <value>', 'WordPress Site Title.' )
	.option( '--WP_TESTS_SITE_TITLE <value>', 'WordPress Site Title.' )
	.option( '--WP_SITEURL <value>', 'WordPress Site URL.' )
	.option( '--WP_TESTS_SITEURL <value>', 'WordPress Site URL.' )
	.option( '--WP_SUBDOMAIN', 'If WordPress Multisite should be Subdomain.' )
	.option(
		'--WP_TESTS_SUBDOMAIN',
		'If WordPress Multisite should be Subdomain.'
	)
	.option( '--WP_UPLOAD_FILETYPES <value>', 'WordPress Allowed Mime Types.' )
	.option(
		'--WP_TESTS_UPLOAD_FILETYPES <value>',
		'WordPress Allowed Mime Types.'
	)
	.option( '--WP_VER <value>', 'WordPress Version.' )
	.option( '--WP_TESTS_VER <value>', 'WordPress Version.' )
	.action( async ( options ) => {
		try {
			info( 'Test Function' );
			const override = {};

			for ( const [ key, value ] of Object.entries( options ) ) {
				if ( ! [ 'debug', 'xdebug', 'update' ].includes( key ) ) {
					delete options[ key ];
					override[ key ] = value;
				}
			}

			options.userConfig = override;

			withSpinner( test, options );
		} catch ( error ) {
			info( `error: ${ error }` );
			process.exit( 1 );
		}
	} );

async function test( { spinner, cmd, userConfig } ) {
	info( 'Configuring .wp-env.json file...' );
	const config = await buildWPEnv( { spinner, userConfig } );

	cmd = 'wp eval-file ./wp-caweb.php cb=test';
	await testCLI( spinner, 'tests', config, cmd );
}
