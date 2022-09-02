#!/usr/bin/env node
/**
* External dependencies
*/
const program = require('commander');
const {copyFile } = require('fs').promises;
const { resolve, join, basename } = require( 'path' );
const dockerCompose = require('docker-compose');
/*
const wpEnv = require('@wordpress/env');
const rimraf = require('util').promisify( require( 'rimraf' ) );
const pipeline = require('util').promisify( require( 'stream' ).pipeline );
const got = require( 'got' );
const extractZip = util.promisify( require( 'extract-zip' ) );
*/
/**
 * Internal dependencies
 */
const withSpinner = require('./spinner');
const {
  buildWPEnv,
  buildDockerComposeOverrideConfig,
} = require('./env/config')
const wp_cli = require('./env/wp-cli')
const downloadSources = require('./env/download-sources')
const {
  testCLI,
  addCAWeb
} = require('./env/wordpress')
const {
  code,
  error,
  info,
  success,
} = require('./log');
const { env } = require('process');
const { type } = require('os');

program
  .command('test')
  .description('Test Code')
  .arguments('[slug]')
  .action(
    async(
      slug
    ) => {
      try{
        
        console.log('Test Function')
        
        const config = await buildWPEnv();
        const { workDirectoryPath } = config;
        const dockerComposeConfig = {
          config: [
            resolve(join( workDirectoryPath, 'docker-compose.yml' )),
            resolve(join( workDirectoryPath, 'docker-compose.override.yml' ))
          ],
          log: config.debug,
        };
      
       await buildDockerComposeOverrideConfig(config);
      
        await dockerCompose.upAll( {
          ...dockerComposeConfig,
          commandOptions: [],
        } );
        return
      	const caweb_configurator = resolve(__dirname, 'env/php/caweb.php');
        let env_vars = '';

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
      	for ( let [ key, value ] of Object.entries( config.env.development.config ) ) {
          value = typeof value === 'string' ? `"${ value }"` : value;
          env_vars += `${key}=${ value } `
        }
        
        let cmd = `wp eval-file ./wp-caweb.php cb=test ${env_vars}`;
        
        withSpinner(test, {environment: 'development', config:config, cmd:cmd})
      } catch( error ){
        console.log(error);
        process.exit(1);
      }
    }
  )


async function test({ spinner, environment, config, cmd }){

  await dockerCompose.restartOne( 'mysql', {
    config: resolve(join( config.workDirectoryPath, 'docker-compose.yml' )),
    log: config.debug,
    commandOptions: [],
  } );

  // await testCLI(spinner, environment, config, cmd );

}
