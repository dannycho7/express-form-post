const concat = require("concat-stream");
const path = require("path");
const aws = require("aws-sdk");

// cb is efp.finished()
module.exports = function(uploadInfo, req, cb, handleError) {
	let save_path = path.join(uploadInfo.directory, uploadInfo.filename);
	return concat((data) => {
		let s3params = {
			Bucket: uploadInfo.api.bucketName,
			Key: save_path,
			ACL: uploadInfo.api.ACL,
			Body: data,
			ContentType: uploadInfo.mimetype
		};
		uploadInfo.apiObject.upload(s3params, (err, response) => {
			if (err) {
				handleError(new Error(err.message));
			} else {
				req.files[uploadInfo.fieldname] = response;
				req.files[uploadInfo.fieldname].size = data.byteLength;
				cb();
			}
		});
	});
};
