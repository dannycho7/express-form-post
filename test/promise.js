/* eslint-env node, mocha */

const assert = require("assert");
const createServer = require("./_promiseserver");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

describe("Testing out promise API", function() {

	it("Should have updated req.files", function(done) {
		// http://localhost:5000
		createServer({
			promise: true,
			validateBody: function(body, cb) {
				cb();
			},
			filename: function(req, file, cb) {
				cb(Date.now() + "-" + "File-Should-Upload-Promise");
			},
			directory: path.join(__dirname, "tmp")
		}, () => {
			let returnCount = 0;
			let donePart = () => {
				if(++returnCount === 2) {
					done();
				}
			};
			// submit form and check req.files
			let form1 = new FormData();
			let file1 = fs.createReadStream(__dirname + "/files/large_image.JPG");
			form1.append("upload_img", file1);
			form1.submit("http://localhost:5000", (err, res) => {
				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => {
					let req = JSON.parse(data);
					assert.equal(Object.keys(req.files).length, 1);
					assert.equal(req.files.upload_img.size, 5485407);
					donePart();
				});
			});
			let form2 = new FormData();
			let file2 = fs.createReadStream(path.join(__dirname, "files/empty.txt"));
			form2.append("upload_img", file2);
			form2.submit("http://localhost:5000", (err, res) => {
				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => {
					let req = JSON.parse(data);
					assert.equal(Object.keys(req.files).length, 1);
					assert.equal(req.files.upload_img.size, 0);
					donePart();
				});
			});
		}, 2);
	});

});