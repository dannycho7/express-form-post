const path = require("path");

const storeInDisk = function(busboy, req, next) {
	busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
		let save_filename = this.options.filename || filename;
		let save_directory = path.join(this.options.directory, save_filename);
		let file_contents = require("fs").createWriteStream(save_directory);
		console.log("created write stream");
		file.on("data", (data) => {
			if (!req._file) {
				req._file = true; // setting req._file to true to show at least 1 file has valid buffer
			}
			if (!req.files[fieldname]) {
				req.files[fieldname] = {
					_file: true // there is data in this particular file
				}; 
			}
			file_contents.write(data);
		});
		file.on("limit", () => {
			console.error("Limit reached");
		});
		file.on("end", () => {
			if(file.truncated && req._file) {
				console.log("before crash");
				require("fs").unlink(save_directory, () => {
					console.log("File deleted");
				});
				req._file = undefined;
			}
			req._body = true;
		});
	});

	busboy.on("field", (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
		if (this.options.mimetype == "" || this.options.mimetype == mimetype) {
			req.body[fieldname] = val;
		}
	});
	busboy.on("finish", () => {
		if(!req._file) {
			// no file was uploaded
			return next();
		}
		console.log("Finished receiving user input, actions depends on method");
	});
};

module.exports = storeInDisk;