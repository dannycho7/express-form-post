const concat = require('concat-stream');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

module.exports = (options, filename, mimetype, req, next) => {
	return concat((data) => {
		fs.stat(options.directory, (err, stats) => {
			if (err) {
				mkdirp(options.directory, (err) => {
					if (err) {
						console.log(err);
					} else {
						console.log("Created directory", options.directory);
						cb(path.join(options.directory, filename), data);
						next();
					}
				})
			} else {
				cb(path.join(options.directory, filename), data);
				next();
			}
		});
		
	});
}

let cb = (save_path, data) => {
	let writeStream = fs.createWriteStream(save_path);
	writeStream.write(data, () => {
		req.file = {
			path: save_path
		};
	});
}