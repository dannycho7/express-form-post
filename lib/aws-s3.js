const concat = require("concat-stream");
const path = require("path");
const aws = require("aws-sdk");

module.exports = function(uploadInfo, req, cb, handleError) {
	aws.config.update({
		accessKeyId: uploadInfo.keys.accessKeyId,
		secretAccessKey: uploadInfo.keys.secretAccessKey,
	});
	const s3 = new aws.S3();
	let save_path = path.join(uploadInfo.directory, uploadInfo.filename);
	return concat((data) => {
		let s3params = {
			Bucket: uploadInfo.keys.bucketName,
			Key: save_path,
			ACL: uploadInfo.keys.ACL,
			Body: data,
			ContentType: uploadInfo.mimetype
		};
		s3.upload(s3params, (err, data) => {
			if (err) {
				handleError(err);
			} else {
				req.files[uploadInfo.fieldname] = data;
				cb();
			}
		});
	});
};
