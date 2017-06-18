const concat = require("concat-stream");
const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");

//cb is efp.finished()
module.exports = function(uploadInfo, req, cb, handleError) {
	return concat((data) => {
		fs.stat(uploadInfo.directory, (err, stats) => {
			if (err || !stats) {
				mkdirp(uploadInfo.directory, (err) => {
					if (err) {
						handleError(err);
					} else {
						writeData(data, uploadInfo, req, cb);
					}
				});
			} else if (stats.isFile()) {
				// directory provided is actually a file
				handleError(new Error("this directory is a file"));
			} else {
				writeData(data, uploadInfo, req, cb);
			}
		});
	});
};

const writeData = (data, uploadInfo, req, cb) => {
	let save_path = path.join(uploadInfo.directory, uploadInfo.filename);
	let writeStream = fs.createWriteStream(save_path);
	writeStream.write(data, () => {
		req.files[uploadInfo.fieldname] = {
			path: save_path,
			filename: uploadInfo.filename,
			mimetype: uploadInfo.mimetype,
			encoding: uploadInfo.encoding
		};
		cb();
	});
};
