const concat = require("concat-stream");
const path = require("path");

module.exports = function(uploadInfo, req, next, handleError) {
	let save_path = path.join(uploadInfo.directory, uploadInfo.filename);
	return concat((data) => {
		// Upload file to google drive here from data buffer
	});
};
