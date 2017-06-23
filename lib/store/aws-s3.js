const Stream = require("stream");
const path = require("path");

module.exports = function(uploadInfo, req) {
	let save_path = path.join(uploadInfo.directory, uploadInfo.filename);
	const pass = new Stream.PassThrough();

	/* work around min 1 part required for aborting a "multipart" */
	let abort = false;
	let progressed = false;

	pass.once("finish", () => {}); 
	pass.once("destroy", () => {
		abort = true;
		if(progressed) uploadStream.abort.bind(uploadStream)();
	}); 

	let s3params = {
		Bucket: uploadInfo.api.bucketName,
		Key: save_path,
		ACL: uploadInfo.api.ACL,
		Body: pass,
		ContentType: uploadInfo.mimetype
	};
		
	var uploadStream = this.apiObject.upload(s3params);
	uploadStream.on("httpUploadProgress", (progress) => {
		progressed = true;
		if(abort) uploadStream.abort.bind(uploadStream)();
	});
	uploadStream.send((err, response) => {
		if (err) {
			this.handleError(new Error(err.message));
		} else if(response){
			req.files[uploadInfo.fieldname] = response;
			req.files[uploadInfo.fieldname].size = req.efp._data[uploadInfo.fieldname];
			this.finished();
		}
	});

	return Promise.resolve(pass);
};
