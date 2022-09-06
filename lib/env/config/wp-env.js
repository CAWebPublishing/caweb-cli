#!/usr/bin/env node
/**
* External dependencies
*/
const fs = require( 'fs' )
const { resolve } = require( 'path' );
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
    const configPath = resolve( '.wp-env.json' );
    const content = {
            ...getDefaultWPEnv(),
            config:{
                ...getDefaultWPEnv().config,
                ...userConfig
            }
        };

    await  addDivi({spinner, wpenv:content});
    
    await writeFile(
        configPath,
        JSON.stringify(
            content,
            null,
            '\t'
        )
    );

	const config = await readConfig( configPath );

    return config;
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
                port: 8000,
            }, // No overrides needed, but it should exist.
            tests: {
                port: 8080,
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
async function addDivi({spinner, wpenv}){
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

module.exports = {
    buildWPEnv
}