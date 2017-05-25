const concat = require("concat-stream");
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

module.exports = (uploadInfo, req, next) => {
	return concat((data) => {
		fs.stat(uploadInfo.options.directory, (err, stats) => {
			let save_path = path.join(uploadInfo.options.directory, uploadInfo.filename);
			if (err || !stats) {
				mkdirp(uploadInfo.options.directory, (err) => {
					if (err) {
						console.error(err);
					} else {
						console.log("Created directory", uploadInfo.options.directory);
						cb(save_path, data, uploadInfo.fieldname, req, next);
					}
				});
			} else if (stats.isFile()) {
				// directory provided is actually a file
				console.error("this directory is a file");
				next();
			} else {
				cb(save_path, data, uploadInfo.fieldname, req, next);
			}
		});
		
	});
};

let cb = (save_path, data, fieldname, req, next) => {
	let writeStream = fs.createWriteStream(save_path);
	writeStream.write(data, () => {
		req.files[fieldname] = {
			path: save_path
		};
		next();
	});
};