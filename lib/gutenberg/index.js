/**
 * External dependencies
 */
const program = require( 'commander' );
const { capitalCase } = require( 'change-case' );

/**
 * Internal dependencies
 */
const { updateBlock, updatePlugin, updatePkg } = require( './update-block' );
const { getPluginTemplate, getDefaultValues } = require( './templates' );
const { info } = require( './log' );

program
	.command( 'create-block' )
	.description( 'Create a new gutenberg block.' )
	.arguments( '[slug]' )
	.action( async () => {
		try {
		} catch ( error ) {
			info( error );
			process.exit( 1 );
		}
	} );

program
	.command( 'update-block' )
	.description(
		'Update a gutenberg block previously created with create-block.'
	)
	.arguments( '[slug]' )
	.action( async ( slug ) => {
		try {
			const pluginTemplate = await getPluginTemplate( 'caweb' );
			const defaultValues = getDefaultValues( pluginTemplate );

			if ( slug ) {
				// to prevent loss the following files do not get updated.
				// blocks renderer callback function
				delete pluginTemplate.pluginOutputTemplates[
					'inc/renderer.php'
				];

				// gulp config file wpgulp.config.js
				delete pluginTemplate.pluginOutputTemplates[
					'wpgulp.config.js'
				];
				delete pluginTemplate.pluginOutputTemplates[ 'gulpfile.js' ];

				// block src files
				delete pluginTemplate.blockOutputTemplates[ 'edit.js' ];
				delete pluginTemplate.blockOutputTemplates[ 'editor.scss' ];
				delete pluginTemplate.blockOutputTemplates[ 'index.js' ];
				delete pluginTemplate.blockOutputTemplates[ 'save.js' ];
				delete pluginTemplate.blockOutputTemplates[ 'style.scss' ];

				const answers = {
					...defaultValues,
					slug,
					// Transforms slug to title as a fallback.
					title: capitalCase( slug ),
				};
				await updateBlock( pluginTemplate, answers );
				await updatePlugin( pluginTemplate, answers );
				await updatePkg( pluginTemplate, answers );
			}

			//console.log(pluginTemplate)
		} catch ( error ) {
			info( error );
			process.exit( 1 );
		}
	} );
