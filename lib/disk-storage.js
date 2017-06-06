const concat = require("concat-stream");
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

module.exports = (uploadInfo, req, next) => {
	return concat((data) => {
		fs.stat(uploadInfo.options.directory, (err, stats) => {
			if (err || !stats) {
				mkdirp(uploadInfo.options.directory, (err) => {
					if (err) {
						console.error(err);
					} else {
						writeData(data, uploadInfo, req, next);
					}
				});
			} else if (stats.isFile()) {
				// directory provided is actually a file
				console.error("this directory is a file");
				next();
			} else {
				writeData(data, uploadInfo, req, next);
			}
		});
	});
};

let writeData = (data, uploadInfo, req, next) => {
	let save_path = path.join(uploadInfo.options.directory, uploadInfo.filename);
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