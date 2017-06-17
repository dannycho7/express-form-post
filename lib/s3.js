const aws = require("aws-sdk");
const concat = require("concat-stream");
const path = require("path");

module.exports = function(uploadInfo, req, next, handleError) {
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
		console.log("S3 Parameters: ", s3params);
		s3.upload(s3params, (err, data) => {
			if (err) {
				handleError(err);
			} else {
				req.files[uploadInfo.fieldname] = data;
				next();
			}
		});
	});
};
