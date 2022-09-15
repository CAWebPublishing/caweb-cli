/**
 * External dependencies
 */
const { exec } = require( 'child_process' );
const { promisify } = require( 'util' );
const path = require( 'path' );
const execPromise = promisify( exec );

/**
 * Internal Dependencies
 */
const { info } = require( './log' );

async function createBlock( slug ) {
	const installCmd = `npx @wordpress/create-block ${ slug } --template ${ path.resolve(
		__dirname,
		'..'
	) }/template/index.js `;

	await execPromise( installCmd )
		.then( ( { stdout } ) => {
			info( `${ stdout }` );
		} )
		.catch( ( error ) => {
			info( `error: ${ error.message }` );
		} );
}

module.exports = {
	createBlock,
};
