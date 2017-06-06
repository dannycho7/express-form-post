const path = require("path");
const Busboy = require("busboy");

const ExpressFormPost = function(user_options = {}) {
	this.options = {
		method: user_options.method || "disk-storage",
		directory: user_options.directory || "tmp",
		filename: user_options.filename || "",
		mimetype: user_options.mimetype || "",
		limits: {
			fileSize: user_options.maxfileSize || ""
		},
		keys: user_options.keys || ""
	};
};

const fileHandler = function(req, res, next) {
	if(req.method == "POST") {
		if(req._body) {
			return next();
		}
		req.body = {};
		req.files = {};
		let busboy = new Busboy({ 
			headers: req.headers,
			limits: this.options.limits
		});
		storeInMemory.bind(this)(busboy, req, next);
		req.pipe(busboy);
	} else {
		return next();
	}
};

const storeInMemory = function(busboy, req, next) {
	busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
		let save_filename = this.options.filename || filename;
		let uploadInfo = {
			options: this.options,
			filename: save_filename,
			mimetype: mimetype,
			fieldname: fieldname,
			file: file,
			encoding: encoding
		};
		let file_contents = require(path.join(__dirname, "lib",this.options.method))(uploadInfo, req, next);
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
			console.error("File limit reached");
		});
		file.on("end", () => {
			if (!file.truncated && req._file) {
				file_contents.end();
			} else {
				// File upload failed from limit being reached
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
	});
};

ExpressFormPost.prototype.default  = function() {
	return fileHandler.bind(this);
};

module.exports = ExpressFormPost;