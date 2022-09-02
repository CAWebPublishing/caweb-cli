#!/usr/bin/env node
/**
* External dependencies
*/
const buildDockerComposeConfig  = require('@wordpress/env/lib/build-docker-compose-config');
const yaml = require( 'js-yaml' );
const { writeFile, mkdir } = require( 'fs' ).promises
const { join } = require( 'path' );

/**
* Internal dependencies
*/
const Env = require( '../env' );

function overrideComposeConfigDeprecated( dockerComposeConfig, config ){     
    let composeConfig = {
        version: dockerComposeConfig.version,
        services: {
            ...dockerComposeConfig.services,
            mysql: {
                ...dockerComposeConfig.services.mysql,
                image: `mariadb:${Env.mysql}`,
                container_name: 'mysql'
            },
            "tests-mysql": {
                ...dockerComposeConfig.services['tests-mysql'],
                image: `mariadb:${Env.mysql}`,
                container_name: 'tests-mysql'
            },
            wordpress: {
                ...dockerComposeConfig.services.wordpress,
                container_name: 'wordpress'
            },
            "tests-wordpress": {
                ...dockerComposeConfig.services['tests-wordpress'],
                container_name: 'tests-wordpress'
            },
            phpmyadmin: {
                image: `phpmyadmin:${Env.phpMyAdmin}`,
                container_name: 'phpmyadmin',
                ports: ['9000:80'],
                environment: {
                    PMA_HOST: 'mysql'
                }
            },
            "tests-phpmyadmin": {
                image: `phpmyadmin:${Env.phpMyAdmin}`,
                container_name: 'tests-phpmyadmin',
                ports: ['9090:80'],
                environment: {
                    PMA_HOST: 'tests-mysql'
                }
            }
        },
        volumes: {
            ...dockerComposeConfig.volumes
        },
    };

    // add MYSQL_ROOT_HOST to db services
    composeConfig.services.mysql.environment.MYSQL_ROOT_HOST = 'mysql';
    composeConfig.services['tests-mysql'].environment.MYSQL_ROOT_HOST = 'tests-mysql';

    for ( let [ key, environment ] of Object.entries( config.env ) ) {
        let pre = 'tests' === key ? 'tests-' : '';

        // if user provided MYSQL_ROOT_PASSWORD
        if( undefined !== environment.config.MYSQL_ROOT_PASSWORD ){
            composeConfig.services[`${pre}mysql`].environment.MYSQL_ROOT_PASSWORD = environment.config.MYSQL_ROOT_PASSWORD;
            composeConfig.services[`${pre}phpmyadmin`].environment.MYSQL_ROOT_PASSWORD = environment.config.MYSQL_ROOT_PASSWORD;
        }

        // if user provided MYSQL_DATABASE
        if( undefined !== environment.config.MYSQL_DATABASE ){
            composeConfig.services[`${pre}mysql`].environment.MYSQL_DATABASE = environment.config.MYSQL_DATABASE;
            composeConfig.services[`${pre}wordpress`].environment.WORDPRESS_DB_NAME = environment.config.MYSQL_DATABASE;
        }

        // if user provided MYSQL_USER
        if( undefined !== environment.config.MYSQL_USER ){
            composeConfig.services[`${pre}mysql`].environment.MYSQL_USER = environment.config.MYSQL_USER;
            composeConfig.services[`${pre}wordpress`].environment.WORDPRESS_DB_USER = environment.config.MYSQL_USER;
        }

        // if user provided MYSQL_PASSWORD
        if( undefined !== environment.config.MYSQL_PASSWORD ){
            composeConfig.services[`${pre}mysql`].environment.MYSQL_PASSWORD = environment.config.MYSQL_PASSWORD;
            composeConfig.services[`${pre}wordpress`].environment.WORDPRESS_DB_PASSWORD = environment.config.MYSQL_PASSWORD;
        }
    }

    return composeConfig;
}

function overrideComposeConfig(dockerComposeConfig, config){
    let composeConfig = {
        version: dockerComposeConfig.version,
        services: {
            phpmyadmin: {
                image: `phpmyadmin`,
                container_name: 'phpmyadmin',
                ports: ['9000:80'],
                environment: {
                    PMA_HOST: 'mysql'
                }
            },
            "tests-phpmyadmin": {
                image: `phpmyadmin`,
                container_name: 'tests-phpmyadmin',
                ports: ['9090:80'],
                environment: {
                    PMA_HOST: 'tests-mysql'
                }
            }
        }
    };

    return composeConfig;

}

module.exports = async function buildDockerComposeOverrideConfig(config){

        const baseComposeConfig = buildDockerComposeConfig( config );

        const composeConfig = overrideComposeConfig(baseComposeConfig, config);

        await mkdir( config.workDirectoryPath, { recursive: true } );

		await writeFile(
			join( config.workDirectoryPath, 'docker-compose.override.yml' ),
			yaml.dump( composeConfig )
		);

        return composeConfig
        /*
		await writeFile(
			path.resolve( config.workDirectoryPath, 'Dockerfile' ),
			dockerFileContents(
				dockerComposeConfig.services.wordpress.image,
				config
			)
		);
        */

}
