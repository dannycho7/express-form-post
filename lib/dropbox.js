const concat = require("concat-stream");
const path = require("path");

module.exports = function(uploadInfo, req, cb, handleError) {
	let save_path = path.join(uploadInfo.directory, uploadInfo.filename);
	save_path[0] != "/" ? save_path = "/" + save_path : ""; // dropbox requires absolute path 
	return concat((data) => {
		uploadInfo.apiObject.filesUpload({
			path: save_path,
			contents: data
		})
		.then(function(response) {
			req.files[uploadInfo.fieldname] = response;
			cb();
		})
		.catch(function(error) {
			handleError(new Error(error.error));
		});
	});
};
