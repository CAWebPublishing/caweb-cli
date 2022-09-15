/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/create-block/lib/scaffold.js
 */
/**
 * External dependencies
 */
const { exec } = require( 'child_process' );
const { pascalCase, snakeCase } = require( 'change-case' );
const { join } = require( 'path' );
const { promisify } = require( 'util' );
const execPromise = promisify( exec );

/**
 * Internal dependencies
 */
const { writeOutputTemplate } = require( './output.js' );
const { info } = require( './log' );

async function updateBlock(
	{ blockOutputTemplates },
	{
		$schema,
		apiVersion,
		plugin,
		namespace,
		slug,
		title,
		description,
		dashicon,
		category,
		attributes,
		supports,
		author,
		pluginURI,
		license,
		licenseURI,
		domainPath,
		updateURI,
		version,
		wpScripts,
		wpEnv,
		npmDependencies,
		npmDevDependencies,
		customScripts,
		folderName,
		editorScript,
		editorStyle,
		style,
	}
) {
	const view = {
		$schema,
		apiVersion,
		plugin,
		namespace,
		namespaceSnakeCase: snakeCase( namespace ),
		slug,
		slugSnakeCase: snakeCase( slug ),
		slugPascalCase: pascalCase( slug ),
		title,
		description,
		dashicon,
		category,
		attributes,
		supports,
		version,
		author,
		pluginURI,
		license,
		licenseURI,
		textdomain: slug,
		domainPath,
		updateURI,
		wpScripts,
		wpEnv,
		npmDependencies,
		npmDevDependencies,
		customScripts,
		folderName,
		editorScript,
		editorStyle,
		style,
	};

	/**
	 * Updates Block Template files
	 */
	await Promise.all(
		Object.keys( blockOutputTemplates ).map( async ( outputFile ) => {
			const pathName = view.plugin
				? join( view.folderName, outputFile )
				: join( process.cwd(), view.slug, outputFile );

			await writeOutputTemplate(
				blockOutputTemplates[ outputFile ],
				pathName,
				view
			);
		} )
	);
}

async function updatePlugin(
	{ pluginOutputTemplates },
	{
		$schema,
		apiVersion,
		plugin,
		namespace,
		slug,
		title,
		description,
		dashicon,
		category,
		attributes,
		supports,
		author,
		pluginURI,
		license,
		licenseURI,
		domainPath,
		updateURI,
		version,
		wpScripts,
		wpEnv,
		npmDependencies,
		npmDevDependencies,
		customScripts,
		folderName,
		editorScript,
		editorStyle,
		style,
	}
) {
	const view = {
		$schema,
		apiVersion,
		plugin,
		namespace,
		namespaceSnakeCase: snakeCase( namespace ),
		slug,
		slugSnakeCase: snakeCase( slug ),
		slugPascalCase: pascalCase( slug ),
		title,
		description,
		dashicon,
		category,
		attributes,
		supports,
		version,
		author,
		pluginURI,
		license,
		licenseURI,
		textdomain: slug,
		domainPath,
		updateURI,
		wpScripts,
		wpEnv,
		npmDependencies,
		npmDevDependencies,
		customScripts,
		folderName,
		editorScript,
		editorStyle,
		style,
	};

	/**
	 * Updates Plugin files
	 */
	await Promise.all(
		Object.keys( pluginOutputTemplates ).map( async ( outputFile ) => {
			await writeOutputTemplate(
				pluginOutputTemplates[ outputFile ],
				outputFile,
				view
			);
		} )
	);
}

async function updatePkg(
	{},
	{ slug, npmDependencies, npmDevDependencies, customScripts, oldScripts }
) {
	// const has_pkg_dep = await checkPackageDependency( slug );
	const currentDir = process.cwd();
	let cmdScript = '';

	try {
		// change to block directory
		process.chdir( `${ slug }` );

		const currentPackage = require( process.cwd() + '/package.json' );

		const defaultScripts = {
			build: 'wp-scripts build',
			format: 'wp-scripts format',
			'lint:css': 'wp-scripts lint-style',
			'lint:js': 'wp-scripts lint-js',
			'packages-update': 'wp-scripts packages-update',
			'plugin-zip': 'wp-scripts plugin-zip',
			start: 'wp-scripts start',
			...customScripts,
		};

		const addChanges = [];

		const removalChanges = [];

		const currentNpmScripts = Object.fromEntries(
			Object.entries( currentPackage.scripts ).filter( ( script ) => {
				if ( 'undefined' === `${ defaultScripts[ script[ 0 ] ] }` ) {
					// if an old custom script
					if (
						'undefined' !== `${ oldScripts[ script[ 0 ] ] }` &&
						script[ 1 ] === `${ oldScripts[ script[ 0 ] ] }`
					) {
						removalChanges.push( `scripts.${ script[ 0 ] }` );
						return false;
					}

					return true;
				}

				return false;
			} )
		);

		Object.entries( {
			...defaultScripts,
			...currentNpmScripts,
		} ).map( ( script ) => {
			addChanges.push( `scripts.${ script[ 0 ] }="${ script[ 1 ] }"` );
			return true;
		} );

		await mapDependencies( npmDependencies )
			.concat( mapDependencies( npmDevDependencies, 'devDependencies' ) )
			.map( ( pkg ) => {
				addChanges.push( `${ pkg }` );
				return true;
			} );

		if ( addChanges.length ) {
			cmdScript = `npm pkg set ${ addChanges.join( ' ' ) }`;

			await execPromise( cmdScript );
		}

		if ( removalChanges.length ) {
			// Remove any changes
			cmdScript = `npm pkg delete ${ removalChanges.join( ' ' ) }`;

			await execPromise( cmdScript );
		}

		// Return back to starting directory
		process.chdir( currentDir );
	} catch ( err ) {
		info( `Block: ${ slug }/package.json could not be updated.` );
		info( `chdir: ${ err }` );
	}
}

function mapDependencies( depArr, section = 'dependencies' ) {
	return depArr.map( ( pkg ) => {
		const pkgInfo = pkg.split( '@' ).map( ( val ) => {
			return '' === val ? '@' : val;
		} );

		// dependency has to have more than 2 pieces of data
		// pkg and version
		if ( 2 <= pkgInfo.length ) {
			const pkgVersion = pkgInfo.pop();
			const pkgName = pkgInfo.join( '' );

			return `${ section }.${ pkgName }="^${ pkgVersion }"`;
		}

		return false;
	} );
}

module.exports = {
	updateBlock,
	updatePlugin,
	updatePkg,
};
