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
async function buildWPEnv({spinner}) {
    const configPath = resolve( '.wp-env.json' );
    const overrideConfigPath = resolve( '.wp-env.override.json' );
    const content = JSON.stringify(
        {
            ...getDefaultWPEnv()
        },
        null,
        '\t'
    );
    
    await writeFile(
        configPath,
        content
    );

	const config = await readConfig( configPath );

    await  addDivi({spinner, overrideConfigPath});


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
async function addDivi({spinner, overrideConfigPath}){
    const q = [];
    let overrideConfig = {
        config: {}
    };

    if( fs.existsSync(overrideConfigPath) ){
	    overrideConfig = JSON.parse( await readFile( overrideConfigPath, 'utf-8' ) );
    }

    // if no ET_USERNAME provided.
    if( ! overrideConfig.config.ET_USERNAME ){
        q.push({
            type: 'input',
            name: 'et_user',
            message: 'ElegantThemes Acccount Username:'
        });
    }

    // if no ET_API_KEY provided.
    if( undefined === overrideConfig.config.ET_API_KEY ){
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
            overrideConfig.config.ET_USERNAME = et_user;
        }
            
        if( et_api_key ){
            overrideConfig.config.ET_API_KEY = et_api_key;
        }
            
        await writeFile(
            overrideConfigPath,
            JSON.stringify(
                overrideConfig,
                null,
                '\t'
            )
        );
    }

}

module.exports = {
    buildWPEnv
}