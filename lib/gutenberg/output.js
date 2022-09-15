/**
 * External dependencies
 */
const { dirname, join } = require( 'path' );
const makeDir = require( 'make-dir' );
const { render } = require( 'mustache' );
const { writeFile } = require( 'fs' ).promises;

const writeOutputTemplate = async ( inputFile, outputFile, view ) => {
	// Output files can have names that depend on the slug provided.
	const outputFilePath = join(
		view.slug,
		outputFile.replace( /\$slug/g, view.slug )
	);
	await makeDir( dirname( outputFilePath ) );
	writeFile( outputFilePath, render( inputFile, view ) );
};

module.exports = {
	writeOutputTemplate,
};
