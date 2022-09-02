const { promisify } = require( 'util' );

const {exec, spawn } = require('child_process');

const execPromise = promisify(exec);

async function checkPackageDependency( slug ) {
	const result = await execPromise( `npm search @cagov/${slug} --json` )
    .then(({stdout}) => {
        pkg_info = JSON.parse(stdout)[0];

        return undefined != pkg_info;
      })
      .catch((error) => {
        return false;
    });

    return result;
}

module.exports = checkPackageDependency;