const concat = require("concat-stream");
const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");

module.exports = function(uploadInfo, req, next, handleError) {
	return concat((data) => {
		fs.stat(uploadInfo.directory, (err, stats) => {
			if (err || !stats) {
				mkdirp(uploadInfo.directory, (err) => {
					if (err) {
						handleError(err);
					} else {
						writeData(data, uploadInfo, req, next);
					}
				});
			} else if (stats.isFile()) {
				// directory provided is actually a file
				handleError(new Error("this directory is a file"));
				next();
			} else {
				writeData(data, uploadInfo, req, next);
			}
		});
	});
};

const writeData = (data, uploadInfo, req, next) => {
	let save_path = path.join(uploadInfo.directory, uploadInfo.filename);
	let writeStream = fs.createWriteStream(save_path);
	writeStream.write(data, () => {
		req.files[uploadInfo.fieldname] = {
			path: save_path,
			filename: uploadInfo.filename,
			mimetype: uploadInfo.mimetype,
			encoding: uploadInfo.encoding
		};
		next();
	});
};
