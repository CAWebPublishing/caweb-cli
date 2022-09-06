#!/usr/bin/env node
/**
* External dependencies
*/
const program = require('commander');
const dockerCompose = require('docker-compose');
const wpEnv = require('@wordpress/env');
const retry = require('@wordpress/env/lib/retry');
const { join, resolve } = require( 'path' );
const { copyFile} = require( 'fs' ).promises

/**
 * Internal dependencies
 */
const {
    buildWPEnv,
    buildDockerComposeOverrideConfig
} = require('../config');
const withSpinner = require('../spinner');
const {
	configureWordPress
} = require('../wordpress');
const {
	code,
} = require('../log');

const description = 'Starts a CAWeb Publishing WordPress for development on port 8000 and tests on port 8080 (override with WP_ENV_PORT in the respective config section). ' +
'After first install, use the \'--update\' flag to download updates to mapped sources and to re-apply WordPress configuration options.';

program
 .command('start')
 .description(description)
 .option('--debug', 'Enable debug output.' )
 .option('--update', 'Download source updates and apply WordPress configuration.' )
 .option('--xdebug', 'Enables Xdebug. If not passed, Xdebug is turned off. If no modes are set, uses "debug". You may set multiple Xdebug modes by passing them in a comma-separated list: `--xdebug=develop,coverage`. See https://xdebug.org/docs/all_settings#mode for information about Xdebug modes.' )
 .option('--ET_USERNAME <value>', 'ElegantThemes Username.' )
 .option('--ET_API_KEY <value>', 'ElegantThemes API Key.' )
 .option('--ET_CLASSIC_EDITOR', 'Enable Classic Editor.' )
 .option('--ET_PRODUCT_TOUR', 'Product Tour.' )
 .option('--ET_NEW_BUILDER_EXPERIENCE', 'Enable The Latest Divi Builder Experience.' )
 .option('--CAWEB_VER <value>', 'CAWeb Theme Version.' )
 .option('--CAWEB_GIT_USER <value>', 'GitHub User where updates are received from.' )
 .option('--CAWEB_PRIVATE_REPO', 'Is GitHub Repository private.' )
 .option('--CAWEB_ACCESS_TOKEN <value>', 'GitHub Repository Access Token if privated.' )
 .option('--WP_SITEURL <value>', 'WordPress Site URL.' )
 .option('--WP_HOME <value>', 'WordPress Home URL.' )
 .option('--WP_SITE_TITLE <value>', 'WordPress Site Title.' )
 .option('--WP_PERMALINK <value>', 'WordPress Permalink Structure.' )
 .option('--UPLOAD_FILETYPES <value>', 'WordPress Allowed Mime Types.' )
 .action(
   async(options = {
	debug, 
	update, 
	xdebug,
	ET_USERNAME,
	ET_API_KEY,
	ET_CLASSIC_EDITOR,
	ET_PRODUCT_TOUR,
	ET_NEW_BUILDER_EXPERIENCE,
	CAWEB_VER,
	CAWEB_PRIVATE_REPO,
	CAWEB_ACCESS_TOKEN,
	WP_SITE_TITLE,
	}) => {
     try{
		code('Creating CAWebPublishing Environment...');

		let override = {};

		for(let [ key, value ] of Object.entries( options ) ){
			if( ! ["debug", "xdebug", "update"].includes(key)){
				delete options[key];
				override[key] = value;
			}
		}
		options.userConfig = override;

		await withSpinner(start, options);

	} catch( error ){
       console.log(`${error}`);
       process.exit(1);
     }
	}
 )

 /**
 * Starts the development server.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {boolean} options.update  If true, update sources.
 * @param {string}  options.xdebug  The Xdebug mode to set.
 */
 async function start({ spinner, debug, update, xdebug, userConfig }){
    spinner.text = 'Configuring .wp-env.json file...';
	const config = await buildWPEnv({spinner, userConfig});

	const caweb_configurator = resolve(__dirname, '../php/caweb.php');

	await wpEnv.start({spinner, debug, update, xdebug});
	
	let startPrefixText = spinner.prefixText;
	
	if( config.env.tests.config.WP_TESTS_DOMAIN &&  config.env.tests.config.WP_SITEURL ){
		startPrefixText = startPrefixText.replace(/test site started at https?:\/\/localhost:\d+\//, config.env.tests.config.WP_SITEURL);
	}
	spinner.prefixText = '';
	
	spinner.text = 'Configuring docker-compose.override.yml'
	await buildDockerComposeOverrideConfig(config);

    const { workDirectoryPath } = config;
    const dockerComposeConfig = {
      config: [
        resolve(join( workDirectoryPath, 'docker-compose.yml' )),
        resolve(join( workDirectoryPath, 'docker-compose.override.yml' ))
      ],
      log: config.debug,
    };
    
	await dockerCompose.upMany(['phpmyadmin', 'tests-phpmyadmin'], {
		...dockerComposeConfig,
		commandOptions: [],
	} );

	await Promise.all([
		copyFile(
			caweb_configurator, 
			`${config.workDirectoryPath}/WordPress/wp-caweb.php`
			),
		copyFile(
			caweb_configurator, 
			`${config.workDirectoryPath}/tests-WordPress/wp-caweb.php`
			)
	]);

	await Promise.all([
		retry( () => configureWordPress('development', config, spinner), {
			times: 2,
		} ),
		retry( () => configureWordPress('tests', config, spinner), {
			times: 2,
		} )
	])

	spinner.prefixText = startPrefixText;
	spinner.text = 'Done!'
 }