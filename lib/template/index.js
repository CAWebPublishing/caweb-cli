/**
 * External dependencies
 */
const { join } = require( 'path' );
const {promisify}  = require("util");
const {exec, spawn } = require('child_process');
const execPromise = promisify(exec);
const {capitalCase} = require('change-case');

/**
 * Internal dependencies
 */
const current_cmd = process.argv[2];
const block_slug = 'update-block' == current_cmd ? process.argv[3] : process.argv[2];
const block_slug_title = capitalCase( block_slug );

let npm_dev_dependencies = [
	'caweb@1.0.11',
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

let npm_dependencies = [
	'@wordpress/icons@9.6.0'
];

let custom_scripts = {
	"postbuild": "gulp build",
	"update-block": "cd .. && caweb update-block %npm_package_name%",
};

let old_custom_scripts = {
	"prebuild": `npm install @cagov/${block_slug} --silent`,
};


module.exports = {
	pluginTemplatesPath: join( __dirname, 'plugin' ),
	blockTemplatesPath: join( __dirname, 'block' ),
	assetsPath: join( __dirname, 'assets' ),
	defaultValues: {
		plugin: true,
		version: "1.0.0",
		author: "CAWebPublishing",
		license: "GPL-2.0-or-later",
		licenseURI: "https://www.gnu.org/licenses/gpl-2.0.html",
		pluginURI: `https://github.com/CAWebPublishing/caweb-${block_slug}`,
		namespace: "caweb",
		category: "cagov",
		textdomain: "cagov",
		dashicon: 'format-aside',
		description: `${block_slug_title} Description`,
		supports: {
			"html": true
		},
		attributes: {},
		customScripts: custom_scripts,
		oldScripts: old_custom_scripts,
		npmDependencies: npm_dependencies,
		npmDevDependencies: npm_dev_dependencies,
	}
};