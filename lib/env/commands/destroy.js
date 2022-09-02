#!/usr/bin/env node
/**
* External dependencies
*/
const dockerCompose = require('docker-compose');
const program = require('commander');
const wpEnv = require('@wordpress/env');
const { join, resolve, basename } = require( 'path' );

/**
 * Internal dependencies
 */
const {
  buildWPEnv,
  buildDockerComposeOverrideConfig
} = require('../config');
const {
  code,
} = require('../log');
const withSpinner = require('../spinner');

program
  .command('destroy')
  .description('Destroy a CAWeb Publishg WordPress environment. Deletes docker containers, volumes, and networks associated with the WordPress environment and removes local files.')
  .option('--debug', 'Enable debug output.' )
  .action(
    async(options = {debug}) => {
      try{

        code( 'Destroying CAWebPublishing WordPress environment.' );
        withSpinner(destroy, options)
        
      } catch( error ){
        console.log(error);
        process.exit(1);
      }
    }
  )


 /**
 * Destroys the development server.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
async function destroy({ spinner, debug }){
  	const config = await buildWPEnv( {spinner} );
    const { workDirectoryPath } = config;
    const dockerComposeConfig = {
      config: [
        resolve(join( workDirectoryPath, 'docker-compose.override.yml' ))
      ],
      log: config.debug,
    };
    
    await dockerCompose.down( {
      ...dockerComposeConfig,
      commandOptions: ['--remove-orphans'],
    } );


    await wpEnv.destroy({spinner, debug});
  }

  module.exports = {
    destroy
  }