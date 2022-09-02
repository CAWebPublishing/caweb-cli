/**
 * @see https://github.com/WordPress/gutenberg/blob/02be18717ee47deda9c67a1000dc29c8bafd45dd/packages/env/lib/commands/stop.js
 */
/**
 * External dependencies
 */
const dockerCompose = require('docker-compose');
const program = require('commander');
 const wpEnv = require('@wordpress/env');
 const { join, resolve } = require( 'path' );

 /**
  * Internal dependencies
  */
const withSpinner = require('../spinner');
const {
    buildWPEnv} = require('../config'); 
const {
    code,
  } = require('../log');
  
program
.command('stop')
.description('Stops running a CAWeb Publishing WordPress for development and tests and frees the ports.')
.option('--debug', 'Enable debug output.' )
.action(
  async(options = {debug}) => {
    try{
      code( 'Stopping CAWebPublishing WordPress environments.' );
     withSpinner(stop, options)
    } catch( error ){
      console.log(error);
      process.exit(1);
    }
  }
)

 /**
 * Stops the development server.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
  async function stop({ spinner, debug }){
  	const config = await buildWPEnv();
    const { workDirectoryPath } = config;
    const dockerComposeConfig = {
      config: [
        resolve(join( workDirectoryPath, 'docker-compose.override.yml' ))
      ],
      log: config.debug,
    };
    
    await dockerCompose.stopMany( {
      ...dockerComposeConfig,
      commandOptions: [],
    } );

    await wpEnv.stop({spinner, debug});
  }