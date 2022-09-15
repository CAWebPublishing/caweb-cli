// PHP Variables
const php = '7.4'
const mysql = '10.9.2';
const phpMyAdmin = '5.2.0';
const wp = '6.0.2';

const mime_types = [
	"jpg",
	"jpeg",
	"png",
	"gif",
	"webp",
	"mov",
	"avi",
	"mpg",
	"3gp",
	"3g2",
	"midi",
	"mid",
	"pdf",
	"doc",
	"ppt",
	"odt",
	"pptx",
	"docx",
	"pps",
	"ppsx",
	"xls",
	"xlsx",
	"key",
	"mp3",
	"ogg",
	"flac",
	"m4a",
	"wav",
	"mp4",
	"m4v",
	"webm",
	"ogv",
	"flv", 
	"ico"
];

// WordPress Variables
const wordpress = {
	WP_DEFAULT_THEME: 'CAWeb',
	WP_SITE_TITLE: "CAWeb WordPress Site",
	WP_PERMALINK: '/%postname%/',
	WP_DEBUG: true,
	WP_DEBUG_LOG: true,
	WP_DEBUG_DISPLAY: true,
	FS_METHOD: 'direct',
	SHOW_ON_FRONT: 'page',
	PAGE_ON_FRONT: '2',
	WP_UPLOAD_FILETYPES: mime_types.join(' ')
}

const caweb = {
	CAWEB_VER: 'latest',
	CAWEB_GIT_USER: 'CA-CODE-Works',
	CAWEB_ORG_LOGO: "https://www.caweb.cdt.ca.gov/wp-content/uploads/sites/221/2017/12/CAWEB_PUB_Logo-257x90.jpg",
	CAWEB_ORG_LOGO_ALT_TEXT: "CAWebPublishing Logo",
	CAWEB_FAV_ICON: "https://www.caweb.cdt.ca.gov/wp-content/uploads/sites/221/2017/06/CAWEB-FavIcon-32px.ico",
	CAWEB_COLORSCHEME: "oceanside",
	CAWEB_CONTACT_US_PAGE: "https://caweb.cdt.ca.gov/contact-us/",
	CAWEB_UTILITY_LINK1_ENABLED: false,
	CAWEB_UTILITY_LINK2_ENABLED: false,
	CAWEB_UTILITY_LINK3_ENABLED: false
}

const divi = {
	ET_CLASSIC_EDITOR: true,
	ET_PRODUCT_TOUR: false,
	ET_NEW_BUILDER_EXPERIENCE: false,
}
// development Environment variables
const development = {
	...wordpress,
	...caweb,
	...divi
};

// test Environment variables
const test = {
	...wordpress,
	...caweb,
	...divi,
	WP_SITE_TITLE: "CAWeb WordPress Test Site",
};

module.exports = {
	php,
	mysql,
	phpMyAdmin,
	wp,
	test,
	development,
};