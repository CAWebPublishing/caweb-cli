/**
 * Internal dependencies
 */
const {
    buildWPEnv,
    getDefaultWPEnv
} = require('./wp-env');


const buildDockerComposeOverrideConfig = require('./docker-compose');
const availableOptions = require('./options-key-list');

module.exports = {
    buildWPEnv,
	buildDockerComposeOverrideConfig,
    availableOptions
}
