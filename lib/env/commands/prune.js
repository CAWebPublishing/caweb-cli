#!/usr/bin/env node
/**
* External dependencies
*/
const program = require('commander');
const exec = require('execa');
const inquirer = require('inquirer');

/**
 * Internal dependencies
 */
const {
  code,
} = require('../log');
const withSpinner = require('../spinner');
const {destroy} = require('./destroy');

program
  .command('prune')
  .option('--debug', 'Enable debug output.' )
  .description('Remove all Docker System files from a CAWeb Publishg WordPress environment.')
  .action(
    async(options = {debug}) => {
      try{

        code( 'Destroying CAWebPublishing WordPress environment.' );
        withSpinner(prune, options)
        
      } catch( error ){
        console.log(error);
        process.exit(1);
      }
    }
  )

/**
 * Removes docker items, like networks or volumes, matching the given name.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
async function prune( { spinner, debug } ) {
	await destroy({spinner, debug});
	
	await exec('docker system prune -af');

};