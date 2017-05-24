const fs = require('fs');
const path = require('path');
const Busboy = require('busboy');
const concat = require('concat-stream');
const save_options = {
	method: 'diskstorage',
	directory: '',
	filename: '',
	mimetype: '',
	limits: {

	}
};

const fileHandler = (req, res, next) => {
	if(req.method == "POST") {
		if(req._body) {
			return next();
		}
		let busboy = new Busboy({ 
			headers: req.headers,
			limits: save_options.limits
		});
		busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
			let save_directory = "";
			if(save_options.filename === "") {
				save_path = path.join(save_options.directory, filename);
			} else {
				save_path = path.join(save_options.directory, save_options.filename);
			}
			let file_contents = require(path.join(__dirname, save_options.method))(save_path);
			file.on('data', (data) => {
				file_contents.write(data);
			});
			file.on('limit', () => {
				console.log("Limit reached");
			});
			file.on('end', () => {
				if (!file.truncated) {
					file_contents.end();
				}
				req._body = true;
			});
		});
		busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
			console.log(inspect(val));
		});
		busboy.on('finish', () => {
			console.log("Finished parsing form");
		});
		req.pipe(busboy);
	}
	return next();
}

module.exports = (options) => {
	save_options.method = options.method || "diskstorage";
	save_options.directory = options.directory || "";
	save_options.filename = options.filename || "";
	save_options.mimetype = options.mimetype || "";
	save_options.limits.fileSize = options.maxfileSize || "";
	
	return fileHandler;
}
