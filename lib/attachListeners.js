const hasha = require("hasha");
const path = require("path");

module.exports = function(busboy, req) {

	busboy.on("file", (fieldname, file, originalname, encoding, mimetype) => {
		// emit 'end' event on file skip attaching listeners
		if(originalname == "" || req.efp._data[fieldname] != undefined || req.efp._finished) return file.resume();
		req.efp._data[fieldname] = { size: 0 };

		// Busboy emits limit event before my file listeners can reach it
		file.on("limit", () => {
			this.handleError(new Error("File limit reached on file"));
		});

		// validate file
		new Promise((resolve, reject) => {
			// handlePromise is cb in function declaration
			const handlePromise = (valid) => {
				valid == false ? reject((new Error("Validation error by custom validateFile function"))) : (
					resolve()
				);
			};
			this.opts.validateFile(handlePromise, fieldname, mimetype);
		})
		.then(() => {
			// user may use filename function but incorrectly return nothing. no warning supplied. defaults to hash
			let save_filename = this.opts.filename(originalname, fieldname, mimetype);
			typeof save_filename == "string" && save_filename.length > 0 ? "" : save_filename = hasha(Date.now() + originalname);
			save_filename.includes("/") ? (
				this.opts.directory = path.join(this.opts.directory, save_filename, ".."),
				save_filename = path.basename(path.resolve(...(save_filename.split("/"))))
			): "";

			let uploadInfo = {
				directory: this.opts.directory,
				filename: save_filename,
				mimetype: mimetype,
				fieldname: fieldname,
				file: file,
				encoding: encoding,
				api: this.opts.api
			};

			// init duplex stream (read/writable) or concat-stream depending on store method
			this.storeMethod(uploadInfo, req)
			.then((file_contents) => {
				req.efp._data[fieldname].stream = file_contents;
				// do not end through pipe, since streams should only end through efp finished method
				file.pipe(file_contents, { end: false }); 
				file.on("data", (data) => {
					if(!req.efp._finished) req.efp._data[fieldname].size += data.length;
				});
				file.on("error", (err) => this.handleError(err));
			})
			.catch((err) => {
				this.handleError(err);
			});
			

		})
		.catch((err) => {
			this.handleError(err);
			return file.resume(); // emit 'end' event on file for busboy 'finish' prevents infinite piping for req
		});
	});

	busboy.on("field", (fieldname, val, fieldnameTruncated, valTruncated) => {
		!valTruncated && !fieldnameTruncated ? req.body[fieldname] = val : "";
	});

	busboy.on("error", (err) => this.handleError(err));
	busboy.on("partsLimit", () => this.handleError("parts limit reached"));
	busboy.on("filesLimit", () => this.handleError("files limit reached"));
	busboy.on("fieldsLimit", () => this.handleError("fields limit reached"));

	
	busboy.on("finish", () => {
		if(req.efp._finished) return; // handleError was called
		req.efp.busboy._finished = true;

		new Promise((resolve, reject) => {
			const handlePromise = (flag) => {
				flag == false ? reject(new Error("Validation failed on validateBody function")) : resolve();
			};
			this.opts.validateBody(handlePromise, req.body);
		})
		.then(() => {
			if(Object.keys(req.efp._data).length == 0) return this.finished();
			// check for min size
			for(let key in req.efp._data) {
				if(this.opts.minfileSize > req.efp._data[key].size) {
					return this.handleError(new Error("Uploaded file was smaller than minfileSize."
						+ " the file was of size " + req.efp._data[key].size));
				}
			}
			// save files after all validation
			for(let key in req.efp._data) {
				req.efp._data[key].stream.end();
			}
		})
		.catch((err) => {
			return this.handleError(err);
		});
	});
};