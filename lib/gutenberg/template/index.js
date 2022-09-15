/**
 * External dependencies
 */
const { join } = require( 'path' );
const { capitalCase } = require( 'change-case' );

/**
 * Internal dependencies
 */
const currentCmd = process.argv[ 2 ];
const blockSlug =
	'update-block' === currentCmd ? process.argv[ 3 ] : process.argv[ 2 ];
const blockSlugTitle = capitalCase( blockSlug );

const npmDevDependencies = [
	'caweb-cli@0.0.9',
	'fancy-log@2.0.0',
	'gulp@4.0.2',
	'gulp-cli@2.3.0',
	'gulp-concat@2.6.1',
	'gulp-file@0.4.0',
	'gulp-line-ending-corrector@1.0.3',
	'gulp-sass@5.1.0',
	'gulp-tap@2.0.0',
	'gulp-uglify-es@3.0.0',
	'node-sass@7.0.1',
];

const npmDependencies = [ '@wordpress/icons@9.6.0' ];

const customScripts = {
	postbuild: 'gulp build',
	'update-block': 'cd .. && caweb update-block %npm_package_name%',
};

const oldCustomScripts = {
	prebuild: `npm install @cagov/${ blockSlug } --silent`,
};

module.exports = {
	pluginTemplatesPath: join( __dirname, 'plugin' ),
	blockTemplatesPath: join( __dirname, 'block' ),
	assetsPath: join( __dirname, 'assets' ),
	defaultValues: {
		plugin: true,
		version: '1.0.0',
		author: 'CAWebPublishing',
		license: 'GPL-2.0-or-later',
		licenseURI: 'https://www.gnu.org/licenses/gpl-2.0.html',
		pluginURI: `https://github.com/CAWebPublishing/caweb-${ blockSlug }`,
		namespace: 'caweb',
		category: 'cagov',
		textdomain: 'cagov',
		dashicon: 'format-aside',
		description: `${ blockSlugTitle } Description`,
		supports: {
			html: true,
		},
		attributes: {},
		customScripts,
		oldScripts: oldCustomScripts,
		npmDependencies,
		npmDevDependencies,
	},
};
