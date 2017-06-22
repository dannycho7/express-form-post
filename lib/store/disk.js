const Stream = require("stream");
const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");

//finished is efp.finished()
module.exports = function(uploadInfo, req, finished, handleError) {

	return new Promise((resolve, reject) => {
		checkDir(uploadInfo.directory)
		.then(() => {
			const pass = new Stream.PassThrough();
			let save_path = path.join(uploadInfo.directory, uploadInfo.filename);
			let writeStream = fs.createWriteStream(save_path);
			pass.pipe(writeStream);
			pass.once("finish", () => writeStream.end());
			pass.once("destroy", () => writeStream.emit("destroy"));
			writeStream.once("finish", () => {
				if(req.efp._finished) return; // when stream is to end and the file was deleted
				
				req.files[uploadInfo.fieldname] = {
					path: save_path,
					filename: uploadInfo.filename,
					mimetype: uploadInfo.mimetype,
					encoding: uploadInfo.encoding,
					size: req.efp._data[uploadInfo.fieldname]
				};
				finished();
			});
			writeStream.once("destroy", () => {
				fs.stat(save_path, (err, stats) => {
					if(!stats.isFile()) return;
					fs.unlink(save_path, (err) => {
						if(err) handleError(err);
					});
				});
				// use this as indicator of having deleted file in writeStream end event
				delete req.efp._data[uploadInfo.fieldname]; 
				pass.end();
			});
			resolve(pass);
		})
		.catch((err) => {
			reject(err);
		});
	});
};

const checkDir = function(dir) {
	return new Promise((resolve, reject) => {
		fs.stat(dir, (err, stats) => {
			if (err || !stats) {
				mkdirp(dir, (err) => {
					if (err) return reject(err);
					return resolve();
				});
			} else if (stats.isFile()) { 
				reject(new Error("this directory is a file")); 
			} else {
				resolve();
			}
		});
	});
};