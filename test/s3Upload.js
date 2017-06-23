/* eslint-env node, mocha */

const assert = require("assert");
const createServer = require("./_server");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const apiInfo = {
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	bucketName: process.env.S3_BUCKET_NAME,
	ACL: "public-read"
};

describe("Uploading files to bucket", function() {
	before(function() {
		this.skip();
	});
	it("Should have updated req.files", function(done) {
		this.timeout(15000);
		// http://localhost:5000
		createServer({
			store: "aws-s3",
			api: apiInfo
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

describe("Uploading invalid files to s3", function() {
	it("Uploading a file too big: Should not be in bucket and have an empty req.files", function(done) {
		this.timeout(4000);
		// http://localhost:5000
		createServer({
			store: "aws-s3",
			api: apiInfo,
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
					assert.equal(Object.keys(req.files).length, 0);
					done();
				});
			});
		});
	});

	it("Uploading a file too small: Should not be in bucket and have an empty req.files", function(done) {
		this.timeout(4000);
		// http://localhost:5000
		createServer({
			store: "aws-s3",
			api: apiInfo,
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
					assert.equal(Object.keys(req.files).length, 0);
					done();
				});
			});
		});
	});

	it("Should have an empty req.files and no file uploaded to s3", function(done) {
		this.timeout(4000);
		// http://localhost:5000
		createServer({
			store: "aws-s3",
			api: apiInfo,
			validateFile: function(cb, fieldname, mimetype) {
				if(mimetype != "application/pdf") {
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
					assert.equal(Object.keys(req.files).length, 0);
					done();
				});
			});
		});
	});
});