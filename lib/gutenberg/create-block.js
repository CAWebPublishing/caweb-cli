/**
 * External dependencies
 */
const {exec, spawn } = require('child_process');
const {promisify}  = require("util");
const path = require('path');
const execPromise = promisify(exec);

/**
 * Internal Dependencies
 */

async function createBlock(slug){
    const install_cmd = `npx @wordpress/create-block ${slug} --template ${path.resolve(__dirname, '..')}/template/index.js `; 

    const installation = await execPromise( install_cmd )
      .then(({stdout}) => {
        console.log(`${stdout}`);
      })
      .catch((error) => {
        console.log(`error: ${error.message}`);
    });
    
}

module.exports = {
  createBlock
}