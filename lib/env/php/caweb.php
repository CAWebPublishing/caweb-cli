<?php

$env_vars = array();
$cb = '';

// iterate thru arguments passed to this file
foreach ($args as $arg) {
    // explode arguments to get param=value
    $values = explode('=', $arg);

    // if argument has a param=value relationship
    if( 2 >= count($values) ){

        // save callback function
        if( 'cb' === $values[0] ){
            $cb = $values[1];
        // otherwise add to environment variables associative array
        }else{
            $value = $values[1];

            // convert string values to boolean
            if( 'true' === $value ){
                $value = true;
            }elseif( 'false' === $value ){
                $value = false;
            }

            $env_vars[$values[0]] = $value;
        }
    }

}

// if no callback function was pass exit
if( ! function_exists($cb) ){
    return;
}

// call requested function
call_user_func($cb, $env_vars);

function env_has_value($key, $env_vars = array()){
    return isset($env_vars[$key]);
}

function get_divi_options(){
    return array(
        "ET_USERNAME" => array(
            "option" => 'et_automatic_updates_options',
            "index" => 'username'
        ),
        "ET_API_KEY" => array(
            "option" => 'et_automatic_updates_options',
            "index" => 'api_key'
        ),
        "ET_CLASSIC_EDITOR" => array(
            "option" => 'et_divi',
            "index" => 'et_enable_classic_editor'
        ),
        "ET_PRODUCT_TOUR" => array(
            "option" => 'et_divi',
            "index" => 'et_pb_product_tour_global'
        ),
        "ET_NEW_BUILDER_EXPERIENCE" => array(
            "option" => 'et_bfb_settings',
            "index" => 'enable_bfb'
        )
    );
}

function get_caweb_options(){
    $general = array(
        'CAWEB_DESIGN_SYSTEM_ENABLED' => 'caweb_enable_design_system',
        'CAWEB_TEMPLATE_VER' => 'ca_site_version',
        'CAWEB_FAV_ICON' => 'ca_fav_ico',
        'CAWEB_ORG_LOGO' => 'header_ca_branding',
        'CAWEB_ORG_LOGO_ALT_TEXT' => 'header_ca_branding_alt_text',
        'CAWEB_NAV_MENU_STYLE' => 'ca_default_navigation_menu',
        'CAWEB_COLORSCHEME' => 'ca_site_color_scheme',
        'CAWEB_TITLE_DISPLAY' => 'ca_default_post_title_display',
        'CAWEB_STICKY_NAV' => 'ca_sticky_navigation',
        'CAWEB_MENU_HOME_LINK' => 'ca_home_nav_link',
        'CAWEB_DISPLAY_POSTS_DATE' => 'ca_default_post_date_display',
        'CAWEB_X_UA_COMPATIBILITY' => 'ca_frontpage_search_enabled',
        'CAWEB_FRONTPAGE_SEARCH' => 'ca_home_nav_link',
        'CAWEB_CONTACT_US_PAGE' => 'ca_contact_us_link',
        'CAWEB_GEO_LOCATOR' => 'ca_geo_locator_enabled',
    );

    $git = array(
        "CAWEB_GIT_USER" => 'caweb_username',
        "CAWEB_PRIVATE_REPO" => 'caweb_private_theme_enabled',
        "CAWEB_ACCESS_TOKEN" => 'caweb_password'
    );

    $google = array(
        "CAWEB_GOOGLE_SEARCH_ENGINE_ID" => 'ca_google_search_id',
        "CAWEB_GOOGLE_ANALYTICS_ID" => 'ca_google_analytic_id',
        "CAWEB_GOOGLE_META_ID" => 'ca_google_meta_id',
        "CAWEB_GOOGLE_TRANSLATE_MODE" => 'ca_google_trans_enabled',
        "CAWEB_GOOGLE_TRANSLATE_PAGE" => 'ca_google_trans_page',
        "CAWEB_GOOGLE_TRANSLATE_PAGE_NEW_WINDOW" => 'ca_google_trans_page_new_window',
        "CAWEB_GOOGLE_TRANSLATE_ICON" => 'ca_google_trans_icon'
    );
    
    $utility_header = array(
        'CAWEB_UTILITY_HOME_LINK' => 'ca_utility_home_icon'
    );
    
    for($i = 1; $i < 4; $i++){
        $utility_header["CAWEB_UTILITY_LINK{$i}_ENABLED"] = "ca_utility_link_{$i}_enable";
        $utility_header["CAWEB_UTILITY_LINK{$i}_LABEL"] = "ca_utility_link_{$i}_name";
        $utility_header["CAWEB_UTILITY_LINK{$i}_URL"] = "ca_utility_link_{$i}";
        $utility_header["CAWEB_UTILITY_LINK{$i}_NEW_WINDOW"] = "ca_utility_link_{$i}_new_window";
    }

    return array_merge(
        $general, 
        $git, 
        $utility_header, 
        $google
    );
}

function get_wp_options(){
    return array(
        "WP_SITEURL" => 'siteurl',
        "WP_HOME" => 'home',
        "WP_SITE_TITLE" => 'blogname',
        "SHOW_ON_FRONT" => 'show_on_front',
        "PAGE_ON_FRONT" => 'page_on_front',
        "WP_UPLOAD_FILETYPES" => 'upload_filetypes'
    );
}

function init_options($env_vars){
    update_user_admin($env_vars);
    update_site_settings($env_vars);
    activate_default_theme($env_vars);
    configure_divi($env_vars);
    configure_caweb($env_vars);
}

function configure_divi($env_vars){
    try{
        if( "Divi" !== get_current_theme() ){
            return;
        }
        $options = get_divi_options();
        $divi_options = get_option("et_divi");
        $divi_builder = get_option("et_bfb_settings");
        $divi_updates = get_option("et_automatic_updates_options");

        foreach($options as $key => $value){
            if( env_has_value($key, $env_vars) ){
                $opt = $value['option'];
                $index = $value['index'];
                $option_value = $env_vars[$key];

                switch( $key ){
                    case 'ET_CLASSIC_EDITOR':
                    case 'ET_PRODUCT_TOUR':
                    case 'ET_NEW_BUILDER_EXPERIENCE':
                        $option_value = $env_vars[$key] ? 'on' : 'off';
                        break;
                    default:
                        break;
                }

                switch( $opt ){
                    case 'et_divi':
                        $divi_options[$index] = $option_value; 
                        break;
                    case 'et_bfb_settings':
                        $divi_builder[$index] = $option_value; 
                        break;
                    case 'et_automatic_updates_options':
                        $divi_updates[$index] = $option_value; 
                        break;
                }

                printf( 'Updated %1$s to %2$s.' . "\n", $index, ! empty($option_value) ? $option_value : 0);            
                
            }
        }

        
        update_option("et_divi", $divi_options );
        update_option("et_bfb_settings", $divi_builder );
        update_option("et_automatic_updates_options", $divi_updates );
        
    } catch (Exception $ex) {
        print_r("$ex");
    }
}

/**
 * Insert an attachment from a URL address.
 *
 * @see https://gist.github.com/m1r0/f22d5237ee93bcccb0d9
 * 
 * @param  string   $url            The URL address.
 * @param  int|null $parent_post_id The parent post ID (Optional).
 * @param  bool $id Whether to return the attachment id or the guid (Optional).
 * @return int|false                The attachment ID on success. False on failure.
 */
function wp_insert_attachment_from_url( $url, $parent_post_id = null, $id = true ) {

    $response = wp_remote_get($url);

	if ( 200 !==  wp_remote_retrieve_response_code( $response ) ) {
		return false;
	}

	$test_type        = wp_check_filetype( basename( $url ), get_allowed_mime_types() );
    $test_name = pathinfo( basename( $url ), PATHINFO_FILENAME );
 
    /**
     * WordPress always appends a number to file names that can potentially match image sub-size file names.
     * 
     * @see https://github.com/WordPress/wordpress-develop/blob/6.0/src/wp-includes/functions.php#L2551
     */
    if ( $test_name && preg_match( '/-(?:\d+x\d+|scaled|rotated)$/', $test_name ) ) {
        // We are only replacing and checking if -1 exists already.
        $test_name = str_replace( "{$test_name}", "{$test_name}-1", $test_name );
    }

    $args = array(
        'post_type' => 'attachment',
        'post_mime_type' => $test_type['type'],
        'post_title' => $test_name
    );

    $attachment = get_posts($args);

    if( ! empty($attachment) && isset($attachment[0]->ID) ){
        return $id ? $attachment[0]->ID : $attachment[0]->guid;
    }

    $upload = wp_upload_bits( basename( $url ), null, wp_remote_retrieve_body($response) );

	if ( ! empty( $upload['error'] ) ) {
		return false;
	}

	$file_path        = $upload['file'];
	$file_name        = basename( $file_path );
	$file_type        = wp_check_filetype( $file_name, null );
	$attachment_title = sanitize_file_name( pathinfo( $file_name, PATHINFO_FILENAME ) );
	$wp_upload_dir    = wp_upload_dir();
    $guid = $wp_upload_dir['url'] . '/' . $file_name;


	$post_info = array(
		'guid'           => $guid,
		'post_mime_type' => $file_type['type'],
		'post_title'     => $attachment_title,
		'post_content'   => '',
		'post_status'    => 'inherit',
	);
    
	// Create the attachment.
	$attach_id = wp_insert_attachment( $post_info, $file_path, $parent_post_id );

	// Include image.php.
	require_once ABSPATH . 'wp-admin/includes/image.php';

	// Generate the attachment metadata.
	$attach_data = wp_generate_attachment_metadata( $attach_id, $file_path );

	// Assign metadata to attachment.
	wp_update_attachment_metadata( $attach_id, $attach_data );

	return $id ? $attach_id : $guid;

}

function configure_caweb($env_vars){
    try{
        
        if( "CAWeb" !== get_current_theme() ){
            return;
        }

        $options = get_caweb_options();

        foreach($options as $key => $option_name){
            if( env_has_value($key, $env_vars) ){
                $update_option = 'update_option';
                $option_value = $env_vars[$key];

                switch( $key ){
                    case 'CAWEB_ORG_LOGO':
                    case 'CAWEB_FAV_ICON':
                        $option_value = wp_insert_attachment_from_url($option_value, null, false);
                        break;
                    case 'CAWEB_GIT_USER':
                    case 'CAWEB_PRIVATE_REPO':
                    case 'CAWEB_ACCESS_TOKEN':
                        $update_option = 'update_site_option';
                        break;
                    case 'CAWEB_UTILITY_LINK1_ENABLED':
                    case 'CAWEB_UTILITY_LINK2_ENABLED':
                    case 'CAWEB_UTILITY_LINK3_ENABLED':
                        $option_value = empty($option_value) ? 'false' : 'true';
                        break;
                    default:
                        break;
                }

                call_user_func($update_option, $option_name, $option_value);

                printf( 'Updated %1$s to %2$s.' . "\n", $option_name, $option_value);            
            }
        }

    } catch (Exception $ex) {
        print_r("$ex");
    }
}

function update_site_settings($env_vars){
    try{
        
        $options = get_wp_options();
    
        foreach($options as $key => $option_name ){

            // if key is set as an environment variable
            if( env_has_value($key, $env_vars) ){
                $option_value = $env_vars[$key];
                $update_option = 'update_option';
    
                // if multisite
                if( env_has_value('WP_MULTI_SITE', $env_vars) && $env_vars['WP_MULTI_SITE'] ){
                    if('WP_UPLOAD_FILETYPES' === $key){
                        $update_option = 'update_site_option';
                    }
                }
    
                call_user_func($update_option, $option_name, $option_value);
                printf( 'Updated %1$s to %2$s.' . "\n", $option_name, $option_value);  

            }
        }
        
    } catch (Exception $ex) {
        print_r("$ex");
    }

}

function activate_default_theme($env_vars){
    try{
        if( env_has_value('WP_DEFAULT_THEME', $env_vars)){
            $theme_activation = true;

            // if CAWeb is default theme but Divi is not installed do not activate
            if( 'CAWeb' === $env_vars['WP_DEFAULT_THEME'] && ! wp_get_theme('Divi')->exists() ){
                $theme_activation = false;			
            }

            if( $theme_activation ){
                switch_theme($env_vars['WP_DEFAULT_THEME']);
            }

        }
    } catch (Exception $ex) {
        print_r("$ex");
    }
}

function update_user_admin($env_vars){
    try{
        $user = array();

        // update display name
        if( env_has_value('WP_ADMIN_USER', $env_vars) ){
            global $wpdb;
    
            $wpdb->update(
                $wpdb->users, 
                array(
                    'user_login' => $env_vars['WP_ADMIN_USER']
                ), 
                array(
                    'ID' => 1
                )
            );
    
            $user['display_name'] = $env_vars['WP_ADMIN_USER'];
            $user['user_nicename'] = $env_vars['WP_ADMIN_USER'];
            $user['nickname'] = $env_vars['WP_ADMIN_USER'];
        }
    
        // update password
        if( env_has_value('WP_ADMIN_PASSWORD', $env_vars) ){
            $user['user_pass'] = $env_vars['WP_ADMIN_PASSWORD'];
        }
    
        // update email
        if( env_has_value('WP_ADMIN_EMAIL', $env_vars) ){
            $user['user_email'] = $env_vars['WP_ADMIN_EMAIL'];
        }
    
        // if information was added updated user
        if( ! empty( $user ) ){
            $user['ID'] = 1;
            
            wp_update_user($user);
    
            grant_super_admin(1);
        }
    } catch (Exception $ex) {
        print_r("$ex");
    }

}

function test($env_vars){
    
    print_r( $env_vars);
}
?>