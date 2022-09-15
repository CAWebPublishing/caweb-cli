const { promisify } = require( 'util' );

const { exec } = require( 'child_process' );

const execPromise = promisify( exec );

async function checkPackageDependency( slug ) {
	const result = await execPromise( `npm search @cagov/${ slug } --json` )
		.then( ( { stdout } ) => {
			const pkgInfo = JSON.parse( stdout )[ 0 ];

			return undefined !== pkgInfo;
		} )
		.catch( () => {
			return false;
		} );

	return result;
}

module.exports = checkPackageDependency;
