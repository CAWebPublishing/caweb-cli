const Env = require( '../env' );
const fs = require( 'fs' )
const { resolve } = require( 'path' );
const { writeFile } = fs.promises
const {readConfig} = require('@wordpress/env/lib/config/');

/**
 * Configures WordPress for the given environment by installing WordPress,
 * activating all plugins, and activating the first theme. These steps are
 * performed sequentially so as to not overload the WordPress instance.
 *
 * @param {WPEnvironment} environment The environment to configure. Either 'development' or 'tests'.
 * @param {WPConfig}      config      The wp-env config object.
 * @param {Object}        spinner     A CLI spinner which indicates progress.
 */
async function buildWPEnv() {
    const configPath = resolve( '.wp-env.json' );
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
module.exports = {
    buildWPEnv,
    getDefaultWPEnv
}