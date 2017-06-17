const path = require("path");
const Busboy = require("busboy");

const ExpressFormPost = function(user_options = {}) {
	if(!(this instanceof ExpressFormPost)) return new ExpressFormPost(user_options);

	this.options = {
		store: user_options.method || "disk",
		directory: user_options.directory || "tmp",
		filename: user_options.filename,
		validate: {
			mimetype: user_options.mimetype || "",
			fileSize: user_options.maxfileSize || ""
		},
		keys: user_options.keys || ""
	};

	// Available storage methods
	if(!["disk", "s3"].includes(this.options.method)) {
		this.options.method = "disk";
	}

	if(typeof this.options.filename == "function") {
		let customFileMethod = this.options.filename;
		this.options.filename = function(filename, fieldname, mimetype) {
			let customName = customFileMethod(filename, fieldname, mimetype);
			if(customName == undefined || customName == "") {
				return filename; // returning the filename that is being uploaded
			} 
			return customName;
		}
		
	} else {
		switch(this.options.filename) {
			case undefined:
			case "": 
				this.options.filename = function(filename, fieldname, mimetype) {
					return filename;
				}
				break;
			default:
				let user_input = this.options.filename; // Closures are awesome
				this.options.filename = function(filename, fieldname, mimetype) {
					return user_input;
				}
		}
	}
};

const storeInMemory = function(busboy, req, next) {
	busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
		if (this.options.validate.mimetype != "" && this.options.validate.mimetype != mimetype) {
			return;
		}

		let save_filename = this.options.filename(filename, fieldname, mimetype);

		let uploadInfo = {
			options: this.options,
			filename: save_filename,
			mimetype: mimetype,
			fieldname: fieldname,
			file: file,
			encoding: encoding
		};
		let file_contents = require(path.join(__dirname, "lib", this.options.method))(uploadInfo, req, next);
		file.on("data", (data) => {
			if (!req.files[fieldname]) {
				req.files[fieldname] = {}; 
			}
			file_contents.write(data);
		});
		file.on("limit", () => {
			console.error("File limit reached");
		});
		file.on("end", () => {
			if (!file.truncated && req.files[fieldname]) {
				req._files++; // increment count of files being uploaded to store
				file_contents.end();
			}
			req._body = true;
		});
	});

	busboy.on("field", (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
		req.body[fieldname] = val;
	});
	busboy.on("finish", () => {
		if(req._files == 0) {
			// no file was uploaded
			return next();
		}
	});
};

// Default
const fileHandler = function(req, res, next) {
	if(req.method == "POST") {
		if(req._body) {
			return next();
		}
		req.body = {};
		req.files = {};
		let busboy = new Busboy({ 
			headers: req.headers,
			limits: {
				fileSize: this.options.validate.fileSize
			}
		});
		storeInMemory.bind(this)(busboy, req, next);
		req.pipe(busboy);
	} else {
		return next();
	}
};


ExpressFormPost.prototype.middleware = function() {
	return fileHandler.bind(this);
};

module.exports = ExpressFormPost;