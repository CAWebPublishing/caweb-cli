const chalk = require( 'chalk' );
// import chalk from 'chalk';

const log = console.log;

const code = ( input ) => {
	log( chalk.cyan( input ) );
};

const error = ( input ) => {
	log( chalk.bold.red( input ) );
};

const info = ( input ) => {
	log( input );
};

const success = ( input ) => {
	log( chalk.bold.green( input ) );
};

module.exports = {
	code,
	error,
	info,
	success,
};