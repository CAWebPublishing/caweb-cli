#!/usr/bin/env node
/**
 * External dependencies
 */
const buildDockerComposeConfig = require( '@wordpress/env/lib/build-docker-compose-config' );
const yaml = require( 'js-yaml' );
const { writeFile, mkdir } = require( 'fs' ).promises;
const { join } = require( 'path' );

function overrideComposeConfig( dockerComposeConfig ) {
	const composeConfig = {
		version: dockerComposeConfig.version,
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

module.exports = async function buildDockerComposeOverrideConfig( config ) {
	const baseComposeConfig = buildDockerComposeConfig( config );

	const composeConfig = overrideComposeConfig( baseComposeConfig );

	await mkdir( config.workDirectoryPath, { recursive: true } );

	await writeFile(
		join( config.workDirectoryPath, 'docker-compose.override.yml' ),
		yaml.dump( composeConfig )
	);

	return composeConfig;
	/*
		await writeFile(
			path.resolve( config.workDirectoryPath, 'Dockerfile' ),
			dockerFileContents(
				dockerComposeConfig.services.wordpress.image,
				config
			)
		);
        */
};
