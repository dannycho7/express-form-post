const Stream = require("stream");
const path = require("path");

// finished is efp.finished()
module.exports = function(uploadInfo, req, finished, handleError) {
	let save_path = path.join(uploadInfo.directory, uploadInfo.filename);
	const pass = new Stream.PassThrough();

	
	pass.once("finish", () => {}); 
	pass.once("destroy", () => pass.emit("error")); 

	let s3params = {
		Bucket: uploadInfo.api.bucketName,
		Key: save_path,
		ACL: uploadInfo.api.ACL,
		Body: pass,
		ContentType: uploadInfo.mimetype
	};
		
	uploadInfo.apiObject.upload(s3params, (err, response) => {
		if (err) {
			handleError(new Error(err.message));
		} else if(response){
			req.files[uploadInfo.fieldname] = response;
			req.files[uploadInfo.fieldname].size = req.efp._data[uploadInfo.fieldname];
			pass.end();
			finished();
		}
	});

	return Promise.resolve(pass);
};
