const Busboy = require("busboy");

module.exports = function(req, res, next) {
	if(req.method == "POST" && req.headers["content-type"].includes("multipart")) {
		if(req._body) return next();
		var busboy = new Busboy({ headers: req.headers });

		req._body = true;
		req.body = {};

		busboy.on("file", (fieldname, file) => {
			file.on("data", () => {});
			file.on("limit", () => {});
			file.on("end", () => {});
		});

		busboy.on("field", (fieldname, val, fieldnameTruncated, valTruncated) => {
			req._body ? "" : req._body = true; // flag to prevent other parsers from parsing req for body
			!valTruncated && !fieldnameTruncated ? req.body[fieldname] = val : "";
		});
		busboy.on("finish", () => {
			return next();
		});

		req.pipe(busboy);
	} else {
		return next();
	}
};
