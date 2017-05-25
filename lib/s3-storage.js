const aws = require("aws-sdk");
const concat = require("concat-stream");
const path = require("path");

module.exports = (uploadInfo, req, next) => {
	aws.config.update({
		accessKeyId: uploadInfo.options.keys.accessKeyId,
		secretAccessKey: uploadInfo.options.keys.secretAccessKey,
	});
	const s3 = new aws.S3();
	let save_path = path.join(uploadInfo.options.directory, uploadInfo.filename);
	return concat((data) => {
		let s3params = {
			Bucket: uploadInfo.options.keys.bucketName,
			Key: save_path,
			ACL: "public-read",
			Body: data,
			ContentType: uploadInfo.mimetype
		};
		console.log(s3params);
		s3.upload(s3params, (err, data) => {
			if (err) {
				console.log(err);
			} else {
				req.files[uploadInfo.fieldname] = data;
				next();
			}
		});
	});
};
