/* eslint-env node, mocha */

const assert = require("assert");
const createServer = require("./_middleware");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

/* const apiInfo = {
	accessToken: process.env.dropboxAccessToken
}; */


describe("Uploading multiple files and fields to disk", function() {
	it("Uploading 4 files and 3 fields. They should all be in req.files and req.body respectively", function(done) {
		this.timeout(7000);
		// http://localhost:5000
		createServer({
			directory: path.join(__dirname, "tmp"),	
			filename: function(req, file, cb) {
				cb(Date.now() + "-" + file.originalname);
			}
		}, () => {
			// submit form and check req.files
			let form = new FormData();
			let file1 = fs.createReadStream(path.join(__dirname, "files/medium_image.jpg"));
			let file2 = fs.createReadStream(path.join(__dirname, "files/empty.txt"));
			let file3 = fs.createReadStream(path.join(__dirname, "files/large_image.JPG"));
			let file4 = fs.createReadStream(path.join(__dirname, "files/small_file.txt"));
			form.append("file2", file2);
			form.append("file1", file1);
			form.append("file3", file3);
			form.append("file4", file4);
			form.append("empty-field", "");
			form.append("name", "Danny");
			form.append("password", "1234");

			let form1 = new Promise((resolve) => {
				form.submit("http://localhost:5000", (err, res) => {
					let data = "";
					res.on("data", (chunk) => {
						data += chunk;
					});
					res.on("end", () => {
						let req = JSON.parse(data);
						assert.equal(req.files.file1.size, 130466);
						assert.equal(req.files.file2.size, 0);
						assert.equal(req.files.file3.size, 5485407);
						assert.equal(req.files.file4.size, 35);
						assert.equal(req.body["empty-field"], "");
						assert.equal(req.body.name, "Danny");
						assert.equal(req.body.password, "1234");
						resolve();
					});
				});
			});

			let form2Data = new FormData();
			form2Data.append("file1", fs.createReadStream(path.join(__dirname, "files/medium_image.jpg")));
			form2Data.append("file2", fs.createReadStream(path.join(__dirname, "files/empty.txt")));
			form2Data.append("file3", fs.createReadStream(path.join(__dirname, "files/large_image.JPG")));
			form2Data.append("file4", fs.createReadStream(path.join(__dirname, "files/small_file.txt")));
			form2Data.append("empty-field", "");
			form2Data.append("name", "Danny");
			form2Data.append("password", "1234");

			let form2 = new Promise((resolve) => {
				form2Data.submit("http://localhost:5000", (err, res) => {
					let data = "";
					res.on("data", (chunk) => {
						data += chunk;
					});
					res.on("end", () => {
						let req = JSON.parse(data);
						assert.equal(req.files.file1.size, 130466);
						assert.equal(req.files.file2.size, 0);
						assert.equal(req.files.file3.size, 5485407);
						assert.equal(req.files.file4.size, 35);
						assert.equal(req.body["empty-field"], "");
						assert.equal(req.body.name, "Danny");
						assert.equal(req.body.password, "1234");
						resolve();
					});
				});
			});

			let form3Data = new FormData();
			form3Data.append("file1", fs.createReadStream(path.join(__dirname, "files/medium_image.jpg")));
			form3Data.append("file2", fs.createReadStream(path.join(__dirname, "files/empty.txt")));
			form3Data.append("file3", fs.createReadStream(path.join(__dirname, "files/large_image.JPG")));
			form3Data.append("file4", fs.createReadStream(path.join(__dirname, "files/small_file.txt")));
			form3Data.append("empty-field", "");
			form3Data.append("name", "Danny");
			form3Data.append("password", "1234");

			let form3 = new Promise((resolve) => {
				form3Data.submit("http://localhost:5000", (err, res) => {
					let data = "";
					res.on("data", (chunk) => {
						data += chunk;
					});
					res.on("end", () => {
						let req = JSON.parse(data);
						assert.equal(req.files.file1.size, 130466);
						assert.equal(req.files.file2.size, 0);
						assert.equal(req.files.file3.size, 5485407);
						assert.equal(req.files.file4.size, 35);
						assert.equal(req.body["empty-field"], "");
						assert.equal(req.body.name, "Danny");
						assert.equal(req.body.password, "1234");
						resolve();
					});
				});
			});
			

			Promise.all([form1, form2, form3]).then(() => {
				done();
			}).catch((err) => {
				console.log(err);
				done(err);
			});
		}, 3);
	});
});