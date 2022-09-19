module.exports = async function output( message, spinner ) {
	if ( process.env.CAWEB_GUI && 'true' === process.env.CAWEB_GUI ) {
		process.stdout.write( `\n${ message }` );
	} else {
		spinner.text = message;
	}
};
