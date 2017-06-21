const Stream = require("stream");
const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");

//cb is efp.finished()
module.exports = function(uploadInfo, req, cb, handleError) {
	checkDir(uploadInfo.directory, handleError); // async
	const pass = new Stream.PassThrough();
	let save_path = path.join(uploadInfo.directory, uploadInfo.filename);
	let writeStream = fs.createWriteStream(save_path);
	pass.pipe(writeStream);
	pass.on("end", () => writeStream.end());
	pass.on("destroy", () => writeStream.emit("destroy"));
	writeStream.on("finish", () => {
		if(req.efp._data[uploadInfo.fieldname]) {
			req.files[uploadInfo.fieldname] = {
				path: save_path,
				filename: uploadInfo.filename,
				mimetype: uploadInfo.mimetype,
				encoding: uploadInfo.encoding,
				size: req.efp._data[uploadInfo.fieldname]
			}
			cb();
		}
	});
	writeStream.on("destroy", () => {
		fs.stat(save_path, (err, stats) => {
			if(!stats.isFile()) return;
			fs.unlink(save_path, (err) => {
				if(err) handleError(err);
			});
		});
		delete req.efp._data[uploadInfo.fieldname]; // use this as indicator of having deleted file in writeStream end event
		pass.end();
	});
	return pass;
};

const checkDir = function(dir, handleError) {
	fs.stat(dir, (err, stats) => {
		if (err || !stats) {
			mkdirp(dir, (err) => { if (err) handleError(err); });
		} else if (stats.isFile()) { 
			handleError(new Error("this directory is a file")); 
		} 
	});
}
