const concat = require("concat-stream");
const request = require("request");
const path = require("path");

module.exports = function(uploadInfo, req, next, handleError) {
	let save_path = path.join(uploadInfo.directory, uploadInfo.filename);
	return concat((data) => {
		// Upload file to google drive here from data buffer
		request.post({
			url: "http://localhost:5000",
			multipart: [
				{ body: data }
			]
		}, (err, httpResponse, body) => {
			console.log("Received response from server:", body);
		});
	});
};
