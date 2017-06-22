const hasha = require("hasha");
const path = require("path");

module.exports = function(busboy, req) {

	busboy.on("file", (fieldname, file, originalname, encoding, mimetype) => {
		// emit 'end' event on file skip attaching listeners
		if(originalname == "" || req.efp._data[fieldname] != undefined) return file.resume();

		// Busboy emits limit event before my file listeners can reach it
		file.on("limit", () => {
			this.handleError(new Error("File limit reached on file"));
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
			});
			

		})
		.catch((err) => {
			this.handleError(err);
			return file.resume(); // emit 'end' event on file for busboy 'finish' prevents infinite piping for req
		});
	});

	busboy.on("field", (fieldname, val, fieldnameTruncated, valTruncated) => {
		// Possibly should add some handler for if a certain value was truncated
		!valTruncated && !fieldnameTruncated ? req.body[fieldname] = val : "";
	});
	busboy.on("finish", () => {
		req.efp.busboy._finished = true;
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
					return this.handleError(new Error("Uploaded file was smaller than minfileSize"));
				}
				req.efp.streams[key].end();
			}
			// If there was no files this triggers properly, otherwise it is called when ending streams
			return this.finished();
		})
		.catch((err) => {
			return this.handleError(err);
		});
	});
};