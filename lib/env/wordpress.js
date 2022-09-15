/**
 * External dependencies
 */
const dockerCompose = require( 'docker-compose' );
const fs = require( 'fs' );
const { resolve, join } = require('path');
const fetch = require('node-fetch');

/**
 * Internal dependencies
 */
 const downloadSources = require('./download-sources')
 const {
	info,
	success,
	code,
	error
  } = require('./log');
const {availableOptions} = require('./config');

/**
 * WP CLI Commands
 * @see https://developer.wordpress.org/cli/commands/
 */
const wp_cli_option_set = 'wp option set';
const wp_cli_option_update = 'wp option update';
const wp_cli_user_update = 'wp user update';
const wp_cli_db_query = 'wp db query';
const wp_cli_config_has = 'wp config has';
const wp_cli_config_delete = 'wp config delete';
const wp_cli_rewrite_structure = 'wp rewrite structure';
const wp_cli_theme = 'wp theme';
const wp_cli_eval = 'wp eval';
const wp_cli_eval_file = 'wp eval-file'

/**
 * Promisified dependencies
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
	spinner.text = `Setting WordPress ${environment} Environment Variables`;
	const pre = environment !== 'development' ? 'tests-' : '';
	const dockerComposeConfig = join( config.workDirectoryPath, 'docker-compose.yml');
	let isMultisite = false;
	let isSubdomain = false;
	let permalinkChange = false;
	let env_vars = '';
	let cmd = `${wp_cli_eval_file} ./wp-caweb.php`;
	//output(`Gathering ${environment} environment variables...`, spinner);
	spinner.text = `Gathering ${environment} environment variables...`;
	for ( let [ key, value ] of Object.entries( config.env[ environment ].config ) ) {
		value = typeof value === 'string' ? `"${ value }"` : value;
		
		if( 'WP_MULTI_SITE' === key && true === value ){
			isMultisite = true;
		}

		if( 'WP_SUBDOMAIN' === key && true === value){
			isSubdomain = true;
		}

		if( 'WP_PERMALINK' === key ){
			permalinkChange = true;
		}

		env_vars += `${key}=${ value } `
	}
	
	// convert to multisite 
	if( isMultisite ){
		//output("Configuring WordPress...", spinner);
		spinner.text = "Configuring WordPress...";
		const network = isSubdomain ? '--subdomains' : '';

		await dockerCompose.run(
				`${pre}cli`,
				[ 'bash', '-c', `wp core multisite-convert ${network}` ],
				{
					config: dockerComposeConfig,
					log: config.debug,
				}
		)
		.then(({exitCode, out}) => {
				//info('', spinner);
				//success(`${out}`)
			}, ({exitCode, err}) => {
				//error(`${err}`)
			}) 

	}

	// rewrite permalink structure
	if( permalinkChange ){
		//output(`Rewriting ${environment} Environment Permalink Structure...`, spinner);
		spinner.text = `Rewriting ${environment} Environment Permalink Structure...`;
		
		let permalink = config.env[ environment ].config.WP_PERMALINK;
		
		await dockerCompose.run(
			`${pre}cli`,
			[ 'bash', '-c', `${wp_cli_rewrite_structure} ${permalink} ${ isMultisite ? '--hard' : ''}` ],
			{
				config: dockerComposeConfig,
				log: config.debug,
			}
		)
	}
	
	// clean up wp-config.php
	//output(`Final cleanup of ${environment}...`, spinner);
	spinner.text = `Cleaning ${environment} wp-config.php...`;
	await cleanupWPConfig(environment, config);
	
	// Configuring CAWebPublishing Environment
	//output(`Configuring CAWebPublishing ${environment} Environment...`, spinner);
	spinner.text = `Configuring CAWebPublishing ${environment} Environment...`;
	await dockerCompose.run(
		`${pre}cli`,
		[ 'bash', '-c', `${cmd} cb=init_options ${env_vars}` ],
		{
			config: dockerComposeConfig,
			log: config.debug,
		}
	)
	.then(({out}) =>{
		console.log(`${out}`)
	},
	({err}) => {
		console.log(`${err}`)
	})

}

function output(msg, spinner){
	const isGUI = process.env.CAWEB_GUI && "true" == process.env.CAWEB_GUI;
	if( isGUI ){
		info(msg);
	}else{
		spinner.text = msg;
	}
}


async function cleanupWPConfig(environment, config){
	const pre = environment !== 'development' ? 'tests-' : '';
	let deleteChanges = [];

	availableOptions.map((key) => {
		deleteChanges.push(`${wp_cli_config_has} ${key} && ${wp_cli_config_delete} ${key}`);
	})

	await dockerCompose.run(
		`${pre}cli`,
		[ 'bash', '-c', `${deleteChanges.join(' || ')}` ],
		{
			config: join( config.workDirectoryPath, 'docker-compose.yml' ),
			log: config.debug,
		}
	)
	.then(({exitCode, out}) => {
		//info(`stdout:${out}`, spinner)
	}, ({exitCode, err}) => {
		error(`error:${err}`)
	})
	
}

async function testCLI(spinner, environment, config, cmd){
	const dockerComposeConfig = join( config.workDirectoryPath, 'docker-compose.yml');
	const pre = environment !== 'development' ? 'tests-' : '';

	// info(`Running the following command: ${cmd}`, spinner);
	await dockerCompose.run(
		`${pre}cli`,
		[ 'bash', '-c', `${cmd}` ],
		{
			config: dockerComposeConfig,
			log: config.debug,
		}
	)
	.then(({exitCode, out}) => {
		//code(`exit: ${exitCode}; stdout: ${out}`, spinner)
		code(`exit: ${exitCode}; stdout: ${out}`)
		//return `${out}`
	}, ({exitCode, err}) => {
		info(`error: ${err}`)
	}) 

	info('Done!');
}

module.exports = {
	configureWordPress,
	testCLI
}