/**
 * @see https://github.com/WordPress/gutenberg/blob/02be18717ee47deda9c67a1000dc29c8bafd45dd/packages/env/lib/commands/stop.js
 */
/**
 * External dependencies
 */
const dockerCompose = require( 'docker-compose' );
const program = require( 'commander' );
const wpEnv = require( '@wordpress/env' );
const { join, resolve } = require( 'path' );
const md5 = require( '@wordpress/env/lib/md5' );

/**
 * Internal dependencies
 */
const withSpinner = require( '../spinner' );
const { getHomeDirectory } = require( '../config' );
const { info } = require( '../log' );
const output = require( '../output' );

program
	.command( 'stop' )
	.description(
		'Stops running a CAWeb Publishing WordPress for development and tests and frees the ports.'
	)
	.option( '--debug', 'Enable debug output.' )
	.action( async ( options ) => {
		try {
			withSpinner( stop, options );
		} catch ( error ) {
			info( error );
			process.exit( 1 );
		}
	} );

/**
 * Stops the development server.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
async function stop( { spinner, debug } ) {
	const configPath = resolve( '.wp-env.json' );
	const configHash = md5( configPath );
	const workDirectoryPath = resolve( await getHomeDirectory(), configHash );
	const dockerComposeFile = join(
		workDirectoryPath,
		'docker-compose.override.yml'
	);
	const dockerComposeConfig = {
		config: [ dockerComposeFile ],
		log: debug,
	};

	output( 'Stopping CAWebPublishing WordPress environments.', spinner );
	await dockerCompose.down( {
		...dockerComposeConfig,
		commandOptions: [ '--remove-orphans' ],
	} );

	await wpEnv.stop( { spinner, debug } );
}
