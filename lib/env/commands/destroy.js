#!/usr/bin/env node
/**
 * External dependencies
 */
const dockerCompose = require( 'docker-compose' );
const program = require( 'commander' );
const wpEnv = require( '@wordpress/env' );
const { join, resolve } = require( 'path' );
const fs = require( 'fs' );
const md5 = require( '@wordpress/env/lib/md5' );

/**
 * Internal dependencies
 */
const { getHomeDirectory } = require( '../config' );
const { info } = require( '../log' );
const withSpinner = require( '../spinner' );
const output = require( '../output' );

program
	.command( 'destroy' )
	.description(
		'Destroy a CAWeb Publishg WordPress environment. Deletes docker containers, volumes, and networks associated with the WordPress environment and removes local files.'
	)
	.option( '--debug', 'Enable debug output.' )
	.action( async ( options ) => {
		try {
			await withSpinner( destroy, options );
		} catch ( err ) {
			info( `${ err }` );
			process.exit( 1 );
		}
	} );

/**
 * Destroys the development server.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
async function destroy( { spinner, debug } ) {
	try {
		const configPath = resolve( '.wp-env.json' );
		const configHash = md5( configPath );
		const workDirectoryPath = resolve(
			await getHomeDirectory(),
			configHash
		);
		const dockerComposeFile = join(
			workDirectoryPath,
			'docker-compose.override.yml'
		);

		const dockerComposeConfig = {
			config: [ dockerComposeFile ],
			log: debug,
		};
		output( 'Destroying CAWebPublishing WordPress environment.', spinner );
		if ( fs.existsSync( dockerComposeFile ) ) {
			await dockerCompose.down( {
				...dockerComposeConfig,
				commandOptions: [ '--remove-orphans' ],
			} );
		}

		await wpEnv.destroy( { spinner, debug } );

		output( 'Done!', spinner );
	} catch ( e ) {
		info( e );
	}
}

module.exports = {
	destroy,
};
