#!/usr/bin/env node
/**
* External dependencies
*/
const fs = require( 'fs' )
const { resolve, join } = require( 'path' );
const { writeFile, readFile } = fs.promises
const {readConfig} = require('@wordpress/env/lib/config/');
const inquirer = require('inquirer');

/**
 * Internal dependencies
 */
 const Env = require( '../env' );

/**
 * Configures WordPress for the given environment by installing WordPress,
 * activating all plugins, and activating the first theme. These steps are
 * performed sequentially so as to not overload the WordPress instance.
 *
 * @param {Object}        spinner     A CLI spinner which indicates progress.
 */
async function buildWPEnv({spinner, userConfig}) {
    try{
        const configPath = resolve( '.wp-env.json' );
        const content = getDefaultWPEnv();
        const regex = /TESTS_/;

        for(let [key, value] of Object.entries(userConfig)){
            // don't add port variables
            if(["WP_ENV_PORT", "WP_ENV_TESTS_PORT", "WP_ENV_TESTS_PORT"].includes(key)){
                continue;
            }
            // if not a test env variable
            if( ! key.match(regex)){
                // add to the config section
                content.config[key] = value;

                // add cookie domain if WP_SITEURL isn't http://localhost
                if(  'WP_SITEURL' === key && 'http://localhost' !== value ){
                    content.config.COOKIE_DOMAIN = '.' + value.replace(/https?:\/\//, '');
                }
            }
            else
            {
                // remove the TESTS_ from the key
                key = key.replace("TESTS_", "");

                // add to the test config section
                content.env.tests.config[key] = value;

                // add cookie domain if WP_SITEURL isn't http://localhost
                if(  'WP_SITEURL' === key && 'http://localhost' !== value ){
                    content.env.tests.config.COOKIE_DOMAIN = '.' + value.replace(/https?:\/\//, '');
                }
            }
        }

        if( ! content.config.WP_MULTI_SITE && content.config.WP_SUBDOMAIN){
            delete content.config.WP_SUBDOMAIN;
        }

        if( ! content.env.tests.config.WP_MULTI_SITE && content.env.tests.config.WP_SUBDOMAIN){
            delete content.env.tests.config.WP_SUBDOMAIN;
        }

        if( undefined == userConfig || ! userConfig.DESTROY ){
            await  getDiviCreds({spinner, wpenv:content});
        }

        await writeFile(
                configPath,
                JSON.stringify(
                    content,
                    null,
                    '\t'
                )
        );

        const config = await readConfig( configPath );
        
        await addDivi(config);
        await addCAWeb(config);

        return config;
    } catch( error ){
        console.log(`${error}`);
    }
} 

function getDefaultWPEnv() {
    let default_wp_env = {
        core: `WordPress/WordPress#${Env.wp}`,
        phpVersion: Env.php,
        plugins: [],
        themes: [],
        mappings: {},
        config: { 
            ...Env.development
        },
        env: {
            development: {
                config:{} // No overrides needed, but it should exist.
            }, 
            tests: {
                config: { 
                    ...Env.test
                },
            },
        },
    }
    
    return default_wp_env;
}

/**
 * 
 * @param {Object}        spinner     A CLI spinner which indicates progress.
 * @param {WPConfig}      overrideConfigPath      The wp-env config file location.
 */
async function getDiviCreds({spinner, wpenv}){
    const q = [];
    
    // if no ET_USERNAME provided.
    if( undefined === wpenv.config.ET_USERNAME ){
        q.push({
            type: 'input',
            name: 'et_user',
            message: 'ElegantThemes Acccount Username:'
        });
    }

    // if no ET_API_KEY provided.
    if( undefined === wpenv.config.ET_API_KEY ){
        q.push({
            type: 'input',
            name: 'et_api_key',
            message: 'ElegantThemes Acccount API Key:'
        });
    }

    if( q.length ){
        spinner.info('Divi Theme information required.');

        // if no ET creds detected prompt for the information.
        const {et_user, et_api_key} = await inquirer.prompt( q );

        if( et_user ){
            wpenv.config.ET_USERNAME = et_user;
        }
            
        if( et_api_key ){
            wpenv.config.ET_API_KEY = et_api_key;
        }
        
    }

}

async function addDivi(config){
	for ( let [ environment, props ] of Object.entries( config.env ) ) {
        // Add Divi theme sources if available
        if( undefined !== props.config.ET_USERNAME && 
            undefined !== props.config.ET_API_KEY){
                
            let pre = "tests" == environment ? "tests-" : "";
            let et_api_user = props.config.ET_USERNAME;
            let et_api_key = props.config.ET_API_KEY;
            let et_api = `https://www.elegantthemes.com/api/api_downloads.php?api_update=1&theme=Divi&api_key=${et_api_key}&username=${et_api_user}&env=${environment}`

            config.env[environment].themeSources.push({
            type: 'zip',
            url: et_api,
            basename: `${pre}Divi`,
            path: resolve(join(config.workDirectoryPath, `/${pre}WordPress/wp-content/themes/Divi`)),
            });

        }
    }

}

async function addCAWeb(config){

	for ( let [ environment, props ] of Object.entries( config.env ) ) {
        // Add CAWeb theme sources if available
        if( undefined !== props.config.CAWEB_VER ){
            const pre = "tests" == environment ? "tests-" : "";
            const theme_path = resolve(join(config.workDirectoryPath , `/${pre}WordPress/wp-content/themes/CAWeb`));
            const caweb_git_user = props.config.CAWEB_GIT_USER;
            const caweb_ver = props.config.CAWEB_VER;
    
            let source = {
                basename: `${pre}CAWeb`,
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
        
            source.url += `?env=${environment}`
            config.env[environment].themeSources.push(source);
        
        }
    }

}

module.exports = {
    buildWPEnv
}