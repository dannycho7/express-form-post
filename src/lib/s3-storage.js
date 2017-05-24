const aws = require('aws-sdk');
const concat = require('concat-stream');
const path = require('path');

module.exports = (options, filename, mimetype, req, next) => {
	aws.config.update({
	  accessKeyId: options.keys.accessKeyId,
	  secretAccessKey: options.keys.secretAccessKey,
	});
	const s3 = new aws.S3();
	let save_path = path.join(options.directory, filename);
	return concat((data) => {
		let s3params = {
			Bucket: options.keys.bucketName,
			Key: save_path,
			ACL: 'public-read',
			Body: data,
			ContentType: mimetype
		};
		s3.upload(s3params, (err, data) => {
			if (err) {
				console.log(err);
			} else {
				req.file = data;
				next();
			}
		});
	});
}