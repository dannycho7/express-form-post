const path = require("path");
const Busboy = require("busboy");

const ExpressFormPost = function(user_options = {}) {
	if(!(this instanceof ExpressFormPost)) return new ExpressFormPost(user_options);

	// validate
	if(user_options.validate && typeof user_options.validate != "function") {
		throw new Error("option 'validate' must be a function.");
	}

	// max file size
	if(user_options.maxfileSize && typeof user_options.maxfileSize != "number") {
		throw new Error("option 'maxfileSize' must be a number.");

		if(!user_options.maxfileSize.isInteger()) {
			throw new Error("option 'maxfileSize' must be an integer (Measured in bytes).");
		}
	}

	// Available storage methods
	if(!["disk", "s3"].includes(user_options.store)) {
		user_options.store = "disk";
	}

	// filename options setup
	if(typeof user_options.filename == "function") {
		let customFileMethod = user_options.filename;
		user_options.filename = function(filename, fieldname, mimetype) {
			let customName = customFileMethod(filename, fieldname, mimetype);
			if(customName == undefined || customName == "") {
				return filename; // returning the filename that is being uploaded
			} 
			return customName;
		}
		
	} else {
		switch(user_options.filename) {
			case undefined:
			case "": 
				user_options.filename = function(filename, fieldname, mimetype) {
					return filename;
				}
				break;
			default:
				let user_input = user_options.filename; // Closures are awesome
				user_options.filename = function(filename, fieldname, mimetype) {
					return user_input;
				}
		}
	}

	this.options = {
		store: user_options.store,
		directory: user_options.directory || "tmp",
		filename: user_options.filename,
		maxfileSize: user_options.maxfileSize,
		validate: user_options.validate,
		keys: user_options.keys
	};

};

const storeInMemory = function(busboy, req, next) {
	busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {

		if (this.options.validate(fieldname, filename, mimetype) == false) {
			return;
		}

		let save_filename = this.options.filename(filename, fieldname, mimetype);

		let uploadInfo = {
			directory: this.options.directory,
			filename: save_filename,
			mimetype: mimetype,
			fieldname: fieldname,
			file: file,
			encoding: encoding,
			keys: this.options.keys
		};

		// init concat-stream
		const storeMethod = require(path.join(__dirname, "lib", this.options.store));
		const file_contents = storeMethod(uploadInfo, req, next, this.handleError);

		file.on("data", (data) => {
			if (!req.files[fieldname]) {
				req.files[fieldname] = {}; 
			}
			file_contents.write(data);
		});
		file.on("limit", () => {
			this.handleError(new Error("File limit reached on file"));
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
				fileSize: this.options.maxfileSize
			}
		});
		storeInMemory.bind(this)(busboy, req, next);
		req.pipe(busboy);
	} else {
		return next();
	}
};

ExpressFormPost.prototype.middleware = function(handleError = undefined) {
	typeof handleError == "function" ? this.handleError = handleError : this.handleError = (err) => {};
	return fileHandler.bind(this);
};

module.exports = ExpressFormPost;