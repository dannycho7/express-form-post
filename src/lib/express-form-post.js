const fs = require('fs');
const path = require('path');
const Busboy = require('busboy');
const concat = require('concat-stream');
const options = {
	method: 'diskstorage',
	directory: '',
	filename: '',
	mimetype: '',
	limits: {

	},
	keys: {

	}
};

const fileHandler = (req, res, next) => {
	if(req.method == "POST") {
		if(req._body) {
			return next();
		}
		let busboy = new Busboy({ 
			headers: req.headers,
			limits: options.limits
		});
		busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
			let save_filename = options.filename || filename;
			let file_contents = require(path.join(__dirname, options.method))
										(options, save_filename, mimetype, req, next);
			file.on('data', (data) => {
				file_contents.write(data);
			});
			file.on('limit', () => {
				console.log("Limit reached");
			});
			file.on('end', () => {
				if (!file.truncated) {
					file_contents.end();
				} else {
					// File upload failed from limit being reached
				}
				req._body = true;
			});
		});

		// TODO: add validation here to check if a file is not actually being uploaded and then call next
		busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
			console.log(inspect(val));
		});
		busboy.on('finish', () => {
			console.log("Finished receiving user input, actions depends on method");
		});
		req.pipe(busboy);
	} else {
		return next();
	}
}

module.exports = (user_options) => {
	options.method = user_options.method || "diskstorage";
	options.directory = user_options.directory || "";
	options.filename = user_options.filename || "";
	options.mimetype = user_options.mimetype || "";
	options.limits.fileSize = user_options.maxfileSize || "";
	options.keys = user_options.keys || "";

	return fileHandler;
}
