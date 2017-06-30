/* eslint-env node, mocha */

const assert = require("assert");
const createServer = require("./_server");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

describe("Upload", () => {
	it("Should have updated req.files", (done) => {
		// http://localhost:5000
		createServer({
			directory: path.join(__dirname, "tmp"),
			filename: function(req, file, cb) {
				cb(file.originalname);
			}
		}, () => {
			// submit form and check req.files
			var form = new FormData();
			let file = fs.createReadStream(__dirname + "/files/medium_image.jpg");
			form.append("upload_img", file);
			form.submit("http://localhost:5000", (err, res) => {
				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => {
					let req = JSON.parse(data);
					assert.equal(req.files.upload_img.size, 130466);
					done();
				});
			});
		});
	});

	it("Should have updated req.files and created the necessary directories", (done) => {
		// http://localhost:5000
		createServer({
			directory: path.join(__dirname, "tmp", Date.now().toString()),
			filename: function(req, file, cb) {
				cb(file.originalname);
			}
		}, () => {
			// submit form and check req.files
			var form = new FormData();
			let file = fs.createReadStream(__dirname + "/files/medium_image.jpg");
			form.append("upload_img", file);
			form.submit("http://localhost:5000", (err, res) => {
				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => {
					let req = JSON.parse(data);
					assert.equal(req.files.upload_img.size, 130466);
					done();
				});
			});
		});
	});
});