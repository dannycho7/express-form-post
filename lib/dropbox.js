const Stream = require("stream");
const path = require("path");
const db = require("dropbox-stream");

module.exports = function(uploadInfo, req, finished, handleError) {
	let save_path = path.join(uploadInfo.directory, uploadInfo.filename);
	save_path[0] != "/" ? save_path = "/" + save_path : ""; // dropbox requires absolute path

	const pass = new Stream.PassThrough();

	let up = db.createDropboxUploadStream({
		token: this.apiObject.accessToken,
		filepath: save_path
	})
	.on("done", (response) => {
		req.files[uploadInfo.fieldname] = response;
		finished();
	})
	.on("progress", (response) => {})
	.on("error", (err) => {
		handleError(new Error(error.error));
	});

	pass.pipe(up);

	return pass;
};
