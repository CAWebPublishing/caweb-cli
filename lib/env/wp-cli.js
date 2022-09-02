#!/usr/bin/env node

/**
 * WP CLI Commands
 * @see https://developer.wordpress.org/cli/commands/
 */
 const wp_cli_option_update = 'wp option update';
 const wp_cli_user_update = 'wp user update';
 const wp_cli_db_query = 'wp db query';
 const wp_cli_rewrite_structure = 'wp rewrite structure';
 const wp_cli_theme = 'wp theme';

 const option = {
    update: []
 }
 module.exports = {
    wp: {
        option: { ...option}
    }
 }