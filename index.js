"use strict";
const path = require("path");
const Busboy = require("busboy");
const hasha = require("hasha");

const ExpressFormPost = function(user_options = {}) {
	if(!(this instanceof ExpressFormPost)) return new ExpressFormPost(user_options);

	// validateFile
	if(user_options.validateFile) {
		if(typeof user_options.validateFile != "function") throw new Error("option 'validateFile' must be a function.");
	} else {
		user_options.validateFile = (handlePromise) => handlePromise();
	}

	/*
	 * validateBody validates the req.body before sending off files to the store
	 * if validateBody is set in any way, the file buffers will be sent to the store after the request has been validated
	 * This means that file_contents.end() only triggers after the "end" event is emitted
	 */
	if(user_options.validateBody) {
		if(typeof user_options.validateBody != "function") {
			throw new Error("option validateBody must be a function.");
		}
	} else {
		user_options.validateBody = (handlePromise) => handlePromise();
	}

	// max file size
	if(user_options.maxfileSize) {
		if(!Number.isInteger(user_options.maxfileSize)) {
			throw new Error("option 'maxfileSize' must be an integer (Measured in bytes).");
		}
	}

	// Available storage methods
	if(!["disk", "aws-s3", "dropbox"].includes(user_options.store)) {
		if(user_options.store == undefined) {
			user_options.store = "disk";
		} else {
			throw new Error("storage " + user_options.store + " is not supported by express-form-post");
		}
	}

	// Setting default directory based on store
	user_options.directory == undefined ? user_options.store == "disk" ? (
		user_options.directory = path.join(module.parent.filename, "..")
	) : user_options.directory = "" : "";

	// filename options setup
	if(typeof user_options.filename == "function") {
		let customFileMethod = user_options.filename;
		user_options.filename = function(originalname, fieldname, mimetype) {
			let customName = customFileMethod(originalname, fieldname, mimetype);
			if(customName == undefined || customName == "") {
				return originalname; // returning the original name that is being uploaded
			} 
			return customName;
		};
		
	} else {
		switch(user_options.filename) {
		case undefined:
		case "": 
			user_options.filename = (originalname) => { return hasha(originalname); };
			break;
		default:
			var user_input = user_options.filename; // Closures are awesome
			user_options.filename = () => { return user_input; };
		}
	}

	this.options = {
		store: user_options.store,
		directory: user_options.directory,
		filename: user_options.filename,
		maxfileSize: user_options.maxfileSize,
		minfileSize: user_options.minfileSize || 0,
		validateFile: user_options.validateFile,
		validateBody: user_options.validateBody,
		api: user_options.api
	};

	this.storeMethod = require(path.join(__dirname, "lib", this.options.store));

	// set up abi objects here so we won't have to recreate upon sending buffer to store handler
	switch(this.options.store){
	case "aws-s3":{
		let aws = require("aws-sdk");
		aws.config.update({
			accessKeyId: this.options.api.accessKeyId,
			secretAccessKey: this.options.api.secretAccessKey,
		});
		this.apiObject = new aws.S3();
		break;
	}
	case "dropbox":{
		let Dropbox = require("dropbox");	
		this.apiObject = new Dropbox({
			accessToken: this.options.api.accessToken,
			clientId: this.options.api.clientId,
			selectUser: this.options.api.selectUser,
		});
		break;
	}
	default:
		this.apiObject = {}; // apiObject does not init on disk
	}
};

ExpressFormPost.prototype._attachListeners = function(busboy, req) {

	busboy.on("file", (fieldname, file, originalname, encoding, mimetype) => {
		// emit 'end' event on file skip attaching listeners
		if(originalname == "" || req.efp._finished || req.efp._data[fieldname] != undefined) return file.resume();

		// Busboy emits limit event before my file listeners can reach it
		file.on("limit", () => {
			!req.efp._finished ? (
				this.removeUploads(),
				this.handleError(new Error("File limit reached on file"))
			): "";
		});

		new Promise((resolve, reject) => {
			// handlePromise is cb in function declaration
			const handlePromise = (valid) => {
				valid == false ? reject((new Error("Validation error by custom validateFile function"))) : (
					resolve()
				);
			};
			this.options.validateFile(handlePromise, fieldname, mimetype);
		})
		.then(() => {
			// user may use filename function but incorrectly return nothing. no warning supplied. defaults to hash
			let save_filename = this.options.filename(originalname, fieldname, mimetype);
			typeof save_filename == "string" && save_filename.length > 0 ? "" : save_filename = hasha(originalname);
			save_filename.includes("/") ? (
				this.options.directory = path.join(this.options.directory, save_filename, ".."),
				save_filename = path.basename(path.resolve(...(save_filename.split("/"))))
			): "";

			let uploadInfo = {
				directory: this.options.directory,
				filename: save_filename,
				mimetype: mimetype,
				fieldname: fieldname,
				file: file,
				encoding: encoding,
				api: this.options.api,
				apiObject: this.apiObject
			};

			// init duplex stream (read/writable) or concat-stream depending on store method
			this.storeMethod(uploadInfo, req, this.finished, this.handleError)
			.then((file_contents) => {
				req.efp.streams[fieldname] = file_contents;
				req.efp._data[fieldname] = 0; // initialize the stream size tracker

				file.on("data", (data) => {
					if(!req.efp._finished) {
						req.efp._data[fieldname] += data.length;
						file_contents.write(data);
					}
				});
			})
			.catch((err) => {
				this.handleError(err);
			})
			

		})
		.catch((err) => {
			this.removeUploads();
			this.handleError(err);
			return file.resume(); // emit 'end' event on file for busboy 'finish' prevents infinite piping for req
		});
	});

	busboy.on("field", (fieldname, val, fieldnameTruncated, valTruncated) => {
		// Possibly should add some handler for if a certain value was truncated
		!req.efp._finished && !valTruncated && !fieldnameTruncated ? req.body[fieldname] = val : "";
	});
	busboy.on("finish", () => {
		req.efp.busboy._finished = true;
		if(req.efp._finished) return;
		new Promise((resolve, reject) => {
			const handlePromise = (flag) => {
				flag == false ? reject(new Error("Validation failed on validateBody function")) : resolve();
			};
			this.options.validateBody(handlePromise, req.body);
		})
		.then(() => {
			// streams and _data use the same keys and map to different info of same file
			for(var key in req.efp.streams) {
				if(this.options.minfileSize > req.efp._data[key]) {
					this.removeUploads();
					return this.handleError(new Error("Uploaded file was smaller than minfileSize"));
				}
				req.efp.streams[key].end();
			}
			return this.finished(); // If there was no files this triggers properly, otherwise it is called when ending streams
		})
		.catch((err) => {
			this.removeUploads();
			return this.handleError(err);
		});
	});
};

ExpressFormPost.prototype._fileHandler = function(req, res, cb) {
	if(req.method == "POST") {
		if(req._body) return cb();
		/*
		 * _validFile defaults to true and becomes false if the file being uploaded is not valid
		 * _finished is false by default and set to true if efp has "finished". Usually this just means that
		 * the next middleware has been called already and further calls to finished and handleError does nothing
		 * efp.busboy._finished is false by default and true if busboy is done parsing
		 * _data tracks the amount of data the file with that key has currently uploaded to the stream
		 */
		req.efp = { _validFile: true, _finished: false, _data: {}, busboy: { _finished: false }, streams: {}};
		req.body = {};
		req._body = true; // prevent multiple multipart middleware and body-parser from colliding
		req.files = {};
		
		/* 
		 * In middleware, this.finished passes on to next middleware
		 * Validation checking in this.finished because of upload function cb not next param in middleware
		 * In upload function, this.finished will be the callback with an err parameter. (err be undefined)
		 * this.finished will be called when finished with parsing the request to pass on to the cb action
		 * buffers array holds file contents that should be sent to the store if the body is valid
		 */
		this.next = cb; // for middleware usage
		this.finished = function(err) {
			if(req.efp._finished) return;
			if(err) {
				req.efp._finished = true;
				return cb(err); // only gets called when upload is being used and as handleError
			}
			if(Object.keys(req.files).length == Object.keys(req.efp._data).length && req.efp.busboy._finished) {
				// all files that were sent to the store have been uploaded and busboy is done parsing
				req.efp._finished = true;
				return cb();
			}
		};

		// make sure this is called before handleError call
		this.removeUploads = function() {
			if(req.efp._finished) return;
			req.body = {};
			for(var key in req.efp.streams) {
				req.efp.streams[key].emit("destroy");
			}
		};

		/*
		 * A call to this.handleError will nullify any subsequent calls to this.finished and this.handleError
		 * 1st expr resolves to middleware and 2nd to upload
		 */
		this.handleError ? (
			// User input based handle Error assignment - handleError could resolve to something not 
			// a function if the user input is incorrect. ignore if so 
			typeof this.middleware.handleError == "function" ? (
				this.handleError = (err) => {
					!req.efp._finished? (
						req.efp._finished = true, 
						this.middleware.handleError(err), 
						this.next()
					) : ""; 
				} 
			) : (
				this.handleError = () => { 
					!req.efp._finished ? (
						req.efp._finished = true, 
						this.next() 
					): "";
				}
			)
		) : this.handleError = this.finished;

		try {
			var busboy = new Busboy({ 
				headers: req.headers,
				limits: {
					fileSize: this.options.maxfileSize
				}
			});
			this._attachListeners(busboy, req);
			req.pipe(busboy);
		} catch(err) {
			this.handleError(err);
		}
	} else {
		return cb();
	}
};

ExpressFormPost.prototype.fields = function() {
	return require("./lib/fields").bind(this);
};

ExpressFormPost.prototype.middleware = function(handleError = undefined) {
	this.middleware.handleError = handleError; // the function to be called inside handleError
	this.handleError = () => {}; // empty anon function to be reassigned in fileHandler
	/*
	 * fileHandler will be called in app.use as (req, res, cb)
	 * binding this to the return value because when it is used in the express middleware _filehandler loses this context
	 * the value of _fileHandler the function is being used to call rather than the function itself
	 */
	return this._fileHandler.bind(this);
};

// Upload function to be used within routes. handleError set as callback as well and can be check with if (err)
ExpressFormPost.prototype.upload = function(req, res, cb = () => {}) {
	typeof cb == "function" ? "" : cb = () => {}; // prevent user failure
	// reassign in fileHandler
	this.handleError = undefined;
	// cb is cb in fileHandler param
	this._fileHandler(req, res, cb);
};


module.exports = ExpressFormPost;