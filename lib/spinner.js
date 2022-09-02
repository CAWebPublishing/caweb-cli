/**
* External dependencies
*/
const ora = require('ora')

/**
 * Internal dependencies
 */
// Spinner.
const withSpinner =
	( command, {...args} ) => {
		const spinner = ora().start();
		args.spinner = spinner;
		let time = process.hrtime();
    
    return command({...args}).then(
        ( message ) => {
            time = process.hrtime( time );
            spinner.succeed(
                `${ message || spinner.text } (in ${ time[ 0 ] }s ${ (
                    time[ 1 ] / 1e6
                ).toFixed( 0 ) }ms)`
            );
            process.exit( 0 );
        },
        ( error ) => {
            spinner.fail( 'An unknown error occured.' );
            spinner.fail( `${error}`);
            process.exit( 1 );
        }
    );
};

module.exports = withSpinner;