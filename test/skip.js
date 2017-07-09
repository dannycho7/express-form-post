/* eslint-env node, mocha */

const assert = require("assert");
const createServer = require("./_server");
const FormData = require("form-data");
const path = require("path");
const fs = require("fs");

describe("Uploading with filename with trailing slashes", function() {
	it("Should resolve to the same file save name", function(done) {
		createServer({
			directory: path.join(__dirname, "tmp"),
			filename: function(fieldname, mimetype, cb) {
				cb("$2a$10$jGlkmUMLBdZ5LvMU0QfWpOtTiH8dqrLw6nIPaF7F_jM.tnTssT4SO/Resume_DannyHyunCho.pdf");
			},
			validateFile: function(file, cb, skip) {
				if(file.fieldname == "upload_img") {
					skip();
				}
				cb();
			}
		}, () => {
			var form = new FormData();
			let file = fs.createReadStream(path.join(__dirname, "files/medium_image.jpg"));
			form.append("upload_img", file);
			form.append("field", "value");
			form.submit("http://localhost:5000", (err, res) => {
				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => {
					let req = JSON.parse(data);
					assert.equal(req.body.field, "value");
					done();
				});
			});
		});
	});
});