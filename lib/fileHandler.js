const Busboy = require("busboy");

module.exports = function(req, res, cb) {
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
				req.unpipe(busboy);
				busboy.removeAllListeners();
				this.removeUploads();
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
			typeof this.middleware.handleError == "function" ? "" : this.middleware.handleError = () => {},
			this.handleError = (err) => {
				!req.efp._finished? (
					req.efp._finished = true,
					req.unpipe(busboy),
					busboy.removeAllListeners(),
					this.removeUploads(),
					this.middleware.handleError(err), 
					this.next()
				) : ""; 
			}
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