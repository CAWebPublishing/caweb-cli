/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/create-block/lib/templates.js
 */
/**
 * External dependencies
 */
const { join, resolve } = require( 'path' );
const glob = require( 'fast-glob' );
const { readFile } = require( 'fs' ).promises;
const { existsSync } = require( 'fs' );
const CLIError = require( '@wordpress/create-block/lib/cli-error' );
/**
 * Internal dependencies
 */
const template = require( './template' );

const predefinedPluginTemplates = {
	caweb: template,
};

const getOutputAssets = async ( outputAssetsPath ) => {
	const outputAssetFiles = await glob( '**/*', {
		cwd: outputAssetsPath,
		dot: true,
	} );
	return Object.fromEntries(
		await Promise.all(
			outputAssetFiles.map( async ( outputAssetFile ) => {
				const outputAsset = await readFile(
					join( outputAssetsPath, outputAssetFile )
				);
				return [ outputAssetFile, outputAsset ];
			} )
		)
	);
};

const getOutputTemplates = async ( outputTemplatesPath ) => {
	const outputTemplatesFiles = await glob( '**/*.mustache', {
		cwd: outputTemplatesPath,
		dot: true,
	} );
	return Object.fromEntries(
		await Promise.all(
			outputTemplatesFiles.map( async ( outputTemplateFile ) => {
				const outputFile = outputTemplateFile.replace(
					/\.mustache$/,
					''
				);
				const outputTemplate = await readFile(
					join( outputTemplatesPath, outputTemplateFile ),
					'utf8'
				);
				return [ outputFile, outputTemplate ];
			} )
		)
	);
};

const configToTemplate = async ( {
	pluginTemplatesPath,
	blockTemplatesPath,
	defaultValues = {},
	assetsPath,
} ) => {
	if ( defaultValues === null || typeof defaultValues !== 'object' ) {
		throw new CLIError( 'Template found but invalid definition provided.' );
	}

	pluginTemplatesPath =
		pluginTemplatesPath || join( __dirname, 'templates', 'plugin' );
	blockTemplatesPath =
		blockTemplatesPath || join( __dirname, 'templates', 'block' );

	return {
		blockOutputTemplates: blockTemplatesPath
			? await getOutputTemplates( blockTemplatesPath )
			: {},
		defaultValues,
		outputAssets: assetsPath ? await getOutputAssets( assetsPath ) : {},
		pluginOutputTemplates: await getOutputTemplates( pluginTemplatesPath ),
	};
};

const getPluginTemplate = async ( templateName ) => {
	if ( predefinedPluginTemplates[ templateName ] ) {
		return await configToTemplate(
			predefinedPluginTemplates[ templateName ]
		);
	}

	try {
		if ( existsSync( resolve( templateName ) ) ) {
			return await configToTemplate( require( resolve( templateName ) ) );
		}
		return await configToTemplate( require( templateName ) );
	} catch ( error ) {
		throw error;
	}
};
const getDefaultValues = ( pluginTemplate ) => {
	return {
		$schema: 'https://schemas.wp.org/trunk/block.json',
		apiVersion: 2,
		namespace: 'create-block',
		category: 'widgets',
		author: 'The WordPress Contributors',
		license: 'GPL-2.0-or-later',
		licenseURI: 'https://www.gnu.org/licenses/gpl-2.0.html',
		version: '0.1.0',
		wpScripts: true,
		customScripts: {},
		wpEnv: false,
		npmDependencies: [],
		folderName: './src',
		editorScript: 'file:./index.js',
		editorStyle: 'file:./index.css',
		style: 'file:./style-index.css',
		...pluginTemplate.defaultValues,
	};
};

module.exports = {
	getPluginTemplate,
	getDefaultValues,
};
