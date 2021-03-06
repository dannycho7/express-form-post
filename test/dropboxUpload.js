/* eslint-env node, mocha */

const assert = require("assert");
const createServer = require("./_server");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const apiInfo = {
	accessToken: process.env.dropboxAccessToken
};

describe("Uploading invalid files to dropbox", function() {
	it("Uploading a file too big: Should not be in dropbox and have an empty req.files", function(done) {
		this.timeout(4000);
		// http://localhost:5000
		createServer({
			store: "dropbox",
			api: apiInfo,
			filename: function(req, file, cb) {
				cb(Date.now() + "-" + file.originalname);
			},
			maxfileSize: 10000
		}, () => {
			// submit form and check req.files
			let form = new FormData();
			let file = fs.createReadStream(__dirname + "/files/medium_image.jpg");
			form.append("upload_img", file);
			form.submit("http://localhost:5000", (err, res) => {
				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => {
					let req = JSON.parse(data);
					assert.deepEqual(req.files, {});
					done();
				});
			});
		});
	});

	it("Uploading a file too small: Should not be in bucket and have an empty req.files", function(done) {
		this.timeout(4000);
		// http://localhost:5000
		createServer({
			store: "dropbox",
			api: apiInfo,
			filename: function(req, file, cb) {
				cb(Date.now() + "-" + file.originalname);
			},
			minfileSize: 1000000000000
		}, () => {
			// submit form and check req.files
			let form = new FormData();
			let file = fs.createReadStream(__dirname + "/files/medium_image.jpg");
			form.append("upload_img", file);
			form.submit("http://localhost:5000", (err, res) => {
				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => {
					let req = JSON.parse(data);
					assert.deepEqual(req.files, {});
					done();
				});
			});
		});
	});

	it("Should have an empty req.files and no file uploaded to dropbox", function(done) {
		this.timeout(4000);
		// http://localhost:5000
		createServer({
			store: "dropbox",
			api: apiInfo,
			filename: function(req, file, cb) {
				cb(Date.now() + "-" + file.originalname);
			},
			validateFile: function(file, cb) {
				if(file.mimetype != "application/pdf") {
					return cb(false);
				}
				return cb();
			}
		}, () => {
			// submit form and check req.files
			let form = new FormData();
			let file = fs.createReadStream(__dirname + "/files/medium_image.jpg");
			form.append("upload_img", file);
			form.submit("http://localhost:5000", (err, res) => {
				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => {
					let req = JSON.parse(data);
					assert.deepEqual(req.files, {});
					done();
				});
			});
		});
	});
});

describe("Uploading files to dropbox", function() {
	before(function() {
		// skipping this test because this is so costly. comment the method if you want to use this test
		// this.skip(); 
	});
	it("Should have updated req.files", function(done) {
		this.timeout(45000);
		// http://localhost:5000
		createServer({
			store: "dropbox",
			api: apiInfo,
			filename: function(req, file, cb) {
				cb(Date.now() + "-" + file.originalname);
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
				});

				// submit form and check req.files
				let form = new FormData();
				let file = fs.createReadStream(__dirname + "/files/large_image.JPG");
				form.append("upload_img", file);
				form.submit("http://localhost:5000", (err, res) => {
					if(err) done(err);
					let data = "";
					res.on("data", (chunk) => {
						data += chunk;
					});
					res.on("end", () => {
						let req = JSON.parse(data);
						assert.equal(req.files.upload_img.size, 5485407);
						done();
					});
				});
			});
		}, 2);
	});
});