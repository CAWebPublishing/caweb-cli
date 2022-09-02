/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/create-block/lib/scaffold.js
 */
/**
 * External dependencies
 */
 const {exec, spawn } = require('child_process');
 const { pascalCase, snakeCase } = require( 'change-case' );
 const { join } = require( 'path' );
 const {promisify}  = require("util");
 const execPromise = promisify(exec);

/**
 * Internal dependencies
 */
const { writeOutputTemplate } = require( '../output.js' );

async function updateBlock(
    {blockOutputTemplates },
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
	}
    
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
    {pluginOutputTemplates },
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
	}
    
	/**
	 * Updates Plugin files
	 */
    await Promise.all(
		Object.keys( pluginOutputTemplates ).map(
			async ( outputFile ) => {
                await writeOutputTemplate(
					pluginOutputTemplates[ outputFile ],
					outputFile,
					view
				)
            }
		)
	);

}

async function updatePkg(
	{},
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
		oldScripts,
		folderName,
		editorScript,
		editorStyle,
		style,
	}
){

	// const has_pkg_dep = await checkPackageDependency( slug );
	const current_dir = process.cwd();
	let cmd_script = '';

	try {
		// change to block directory
		process.chdir(`${slug}`);

		const current_package = require( process.cwd() + '/package.json');
		
		let default_scripts = {
			"build" : "wp-scripts build",
			"format" : "wp-scripts format",
			"lint:css" : "wp-scripts lint-style",
			"lint:js": "wp-scripts lint-js",
			"packages-update": "wp-scripts packages-update",
			"plugin-zip": "wp-scripts plugin-zip",
			"start": "wp-scripts start",
			...customScripts
		};

		let add_changes = [];

		let removal_changes = [];

		let current_npm_scripts = Object.fromEntries( Object.entries(current_package.scripts).filter( (script) => {
			if( 'undefined' == `${default_scripts[script[0]]}`){
				// if an old custom script
				if( 'undefined' != `${oldScripts[script[0]]}` && script[1] == `${oldScripts[script[0]]}` ){
					removal_changes.push(`scripts.${script[0]}`);
					return false;
				}
				
				return true;
			}
		}))

		Object.entries({
			...default_scripts,
			...current_npm_scripts
		}).map((script) => {
			add_changes.push(`scripts.${script[0]}="${script[1]}"`);
		});


		await mapDependencies(npmDependencies).concat(
			mapDependencies(npmDevDependencies, 'devDependencies')
		).map((pkg) => {
			add_changes.push(`${pkg}`);
		});
		
		if( add_changes.length ){
			cmd_script = `npm pkg set ${add_changes.join(' ')}`;

			await execPromise( cmd_script );
		}

		if( removal_changes.length ){
			// Remove any changes
			cmd_script = `npm pkg delete ${removal_changes.join(' ')}`; 

			await execPromise( cmd_script );
		}

		// Return back to starting directory
		process.chdir(current_dir);
	}
	catch (err) {
		console.log(`Block: ${slug}/package.json could not be updated.`);
		console.log(`chdir: ${err}`);
	}

}

function mapDependencies(dep_arr, section = 'dependencies'){
	return dep_arr.map((pkg) => {
		let pkg_info = pkg.split('@').map(val => {
			return '' == val ? "@" : val;
		});

		// dependency has to have more than 2 pieces of data
		// pkg and version
		if( 2 <= pkg_info.length ){
			let pkg_version = pkg_info.pop();
			let pkg_name = pkg_info.join('');
			
			return `${section}.${pkg_name}="^${pkg_version}"`; 
		}
	});

}

module.exports = {
	updateBlock,
	updatePlugin,
	updatePkg
};
