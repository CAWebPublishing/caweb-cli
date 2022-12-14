/**
 * External dependencies
 */
const ora = require( 'ora' );
const { ValidationError } = require( '@wordpress/env/lib/config' );

/**
 * Internal dependencies
 *
 */
const { info } = require( './log' );

/**
 * @param {string} command
 * @param {Object} root0
 */
const withSpinner = ( command, { ...args } ) => {
	const spinner = ora().start();
	args.spinner = spinner;
	let time = process.hrtime();

	return command( { ...args } ).then(
		( message ) => {
			time = process.hrtime( time );
			spinner.succeed(
				`${ message || spinner.text } (in ${ time[ 0 ] }s ${ (
					time[ 1 ] / 1e6
				).toFixed( 0 ) }ms)`
			);
			//process.exit( 0 );
		},
		( error ) => {
			if ( error instanceof ValidationError ) {
				// Error is a validation error. That means the user did something wrong.
				spinner.fail( error.message );
				process.exit( 1 );
			} else if (
				error &&
				typeof error === 'object' &&
				'exitCode' in error &&
				'err' in error &&
				'out' in error
			) {
				// Error is a docker-compose error. That means something docker-related failed.
				// https://github.com/PDMLab/docker-compose/blob/HEAD/src/index.ts
				spinner.fail( 'Error while running docker-compose command.' );
				if ( error.out ) {
					process.stdout.write( error.out );
				}
				if ( error.err ) {
					process.stderr.write( error.err );
				}
				process.exit( error.exitCode );
			} else if ( error ) {
				// Error is an unknown error. That means there was a bug in our code.
				spinner.fail(
					typeof error === 'string' ? error : error.message
				);
				// Disable reason: Using error() means we get a stack trace.
				info( error );
				process.exit( 1 );
			} else {
				spinner.fail( 'An unknown error occured.' );
				process.exit( 1 );
			}
		}
	);
};

module.exports = withSpinner;
