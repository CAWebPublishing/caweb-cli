/**
 * Internal dependencies
 */
const programs = [ './start', './stop', './destroy', './prune' ];

programs.map( async ( p ) => {
	require( `${ p }` );
	//import `${p}`;
} );
