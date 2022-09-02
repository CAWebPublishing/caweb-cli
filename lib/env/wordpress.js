/**
 * External dependencies
 */
const dockerCompose = require( 'docker-compose' );
const fs = require( 'fs' );
const { resolve, join } = require('path');
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

	spinner.text = "Setting WordPress Environment Variables";
	const pre = environment !== 'development' ? 'tests-' : '';
	const dockerComposeConfig = join( config.workDirectoryPath, 'docker-compose.yml');
	let isMultisite = false;
	let isSubdomain = false;
	let permalinkChange = false;
	let env_vars = '';
	let cmd = `${wp_cli_eval_file} ./wp-caweb.php`;

	spinner.text = "Gathering environment variables...";
	for ( let [ key, value ] of Object.entries( config.env[ environment ].config ) ) {
		value = typeof value === 'string' ? `"${ value }"` : value;
		
		if( 'WP_MULTI_SITE' === key && true === value ){
			isMultisite = true;
		}

		if( 'WP_SUBDOMAIN' === key && true === value){
			isSubdomain = true;
		}

		if( 'WP_PERMALINK' === key && true === value ){
			permalinkChange = true;
		}

		env_vars += `${key}=${ value } `
	}

	// convert to multisite 
	if( isMultisite ){
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
				//info('');
				//success(`${out}`)
			}, ({exitCode, err}) => {
				//error(`${err}`)
			}) 

	}

	// rewrite permalink structure
	if( permalinkChange ){
		spinner.text = "Rewriting Permalink Structure...";
		
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

	// Add Divi and CAWeb theme sources if available
	await Promise.all([
		addDivi(environment, config),
		addCAWeb(environment, config)
	])
	
	if( config.env[environment].themeSources.length || config.env[environment].pluginSources ){
		await downloadSources(config, spinner)
	}
	
	// Configuring CAWebPublishing Environment
	spinner.text = "Configuring CAWebPublishing Environment...";
	await dockerCompose.run(
		`${pre}cli`,
		[ 'bash', '-c', `${cmd} cb=init_options ${env_vars}` ],
		{
			config: dockerComposeConfig,
			log: config.debug,
		}
	)

	// clean up wp-config.php
	spinner.text = "Final cleanup..."
	await cleanupWPConfig(environment, config);
	return;
}

async function addDivi(environment, config){
	if( undefined !== config.env[ environment ].config.ET_USERNAME && undefined !== config.env[ environment ].config.ET_API_KEY){

		const et_api_user = config.env[ environment ].config.ET_USERNAME;
		const et_api_key = config.env[ environment ].config.ET_API_KEY;
		const et_api = `https://www.elegantthemes.com/api/api_downloads.php?api_update=1&theme=Divi&api_key=${et_api_key}&username=${et_api_user}`
	
		config.env[environment].themeSources.push({
			type: 'zip',
			url: et_api,
			basename: 'Divi',
			path: config.workDirectoryPath + '/WordPress/wp-content/themes/Divi',
		});
	
	}

}

async function addCAWeb(environment, config){
	if( undefined !== config.env[ environment ].config.CAWEB_VER ){

		const theme_path = resolve(config.workDirectoryPath + '/WordPress/wp-content/themes/CAWeb');
		const caweb_git_user = config.env[ environment ].config.CAWEB_GIT_USER;
		const caweb_ver = config.env[ environment ].config.CAWEB_VER;
		let source = {
			basename: 'CAWeb',
			type: 'zip',
			url: `https://api.github.com/repos/${caweb_git_user}/CAWeb/zipball/${caweb_ver}`,
			path: theme_path
		}

		// get latest github release version
		if( 'latest' === caweb_ver ){
			let latest_release_url = `https://api.github.com/repos/${caweb_git_user}/CAWeb/releases/latest`;
		
			const response = await fetch(latest_release_url)
			.then(
				(response) => {
					return response.json();
				}
			);

			if( undefined !== response.zipball_url ){
				source.url = response.zipball_url;
			}
		}else if( ! isNaN(caweb_ver.replace(/[a-zA-Z]/g, ''))){
		// if a string was passed and not a version string
		// assume git clone of a branch
			source.type = 'git';
			source.url = `https://github.com/${caweb_git_user}/CAWeb/`;
			source.ref = caweb_ver;
			source.clonePath = theme_path;

			delete source.path;
		}
	
		config.env[environment].themeSources.push(source);
	
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
		//info(`stdout:${out}`)
	}, ({exitCode, err}) => {
		//error(`error:${err}`)
	})
	
}

async function testCLI(spinner, environment, config, cmd){
	const dockerComposeConfig = join( config.workDirectoryPath, 'docker-compose.yml');
	const pre = environment !== 'development' ? 'tests-' : '';

	//spinner.text = `Running the following command: ${cmd}`
	await dockerCompose.run(
		`${pre}cli`,
		[ 'bash', '-c', `${cmd}` ],
		{
			config: dockerComposeConfig,
			log: config.debug,
		}
	)
	.then(({exitCode, out}) => {
		//code(`exit: ${exitCode}; stdout: ${out}`)
		code(`exit: ${exitCode}; stdout: ${out}`)
		//return `${out}`
	}, ({exitCode, err}) => {
		info(`error: ${err}`)
	}) 

	spinner.text = 'Done!'
}

module.exports = {
	configureWordPress,
	testCLI,
	addCAWeb
}