#!/usr/bin/env node
/**
 * External dependencies
 */
const yaml = require( 'js-yaml' );
const { writeFile, mkdir } = require( 'fs' ).promises;
const { join } = require( 'path' );

function overrideComposeConfig() {
	const composeConfig = {
		version: '3.7',
		services: {
			phpmyadmin: {
				image: `phpmyadmin`,
				container_name: 'phpmyadmin',
				ports: [ '9000:80' ],
				environment: {
					PMA_HOST: 'mysql',
				},
			},
			'tests-phpmyadmin': {
				image: `phpmyadmin`,
				container_name: 'tests-phpmyadmin',
				ports: [ '9090:80' ],
				environment: {
					PMA_HOST: 'tests-mysql',
				},
			},
		},
	};

	return composeConfig;
}

module.exports = async function buildDockerComposeOverrideConfig(
	workDirectoryPath
) {
	const composeConfig = overrideComposeConfig();

	await mkdir( workDirectoryPath, { recursive: true } );

	await writeFile(
		join( workDirectoryPath, 'docker-compose.override.yml' ),
		yaml.dump( composeConfig )
	);

	return composeConfig;
};
