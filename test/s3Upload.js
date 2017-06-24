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

describe("Uploading large file to bucket", function() {
	before(function() {
		// skipping this test because this is so costly. comment the method if you want to use this test
		this.skip(); 
	});

	it("Should not have updated req.files", function(done) {
		this.timeout(15000);
		// http://localhost:5000
		createServer({
			store: "aws-s3",
			api: apiInfo,
			validateBody: function(cb) {
				cb(false);
			},
			filename: function() {
				return "Should-not-have-updated-req-files";
			}
		}, () => {
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
					assert.equal(Object.keys(req.files).length, 0);
				});
			});
		}, 1, 2000, done);
	});

	/*
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
	});*/
});
describe("Uploading multiple files to s3", function() {

	it("Should have added the small file and empty file to req.files", function(done) {
		this.timeout(3000);
		createServer({
			store: "aws-s3",
			api: apiInfo,
			filename: function(originalname) {
				return Date.now() + "-" + originalname;
			}
		}, () => {
			var form = new FormData();
			let file1 = fs.createReadStream(path.join(__dirname, "files/small_file.txt"));
			let file2 = fs.createReadStream(path.join(__dirname, "files/empty.txt"));
			form.append("upload_img1", file1);
			form.append("upload_img2", file2);
			form.submit("http://localhost:5000", (err, res) => {
				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => {
					let req = JSON.parse(data);
					assert.equal(req.files.upload_img1.size, 35);
					assert.equal(req.files.upload_img2.size, 0);
					done();
				});
			});
		});
	});

	it("Should have skipped the 2nd file in req.files", function(done) {
		this.timeout(3000);
		createServer({
			store: "aws-s3",
			api: apiInfo,
			filename: function(originalname) {
				return Date.now() + "-" + originalname;
			}
		}, () => {
			var form = new FormData();
			let file1 = fs.createReadStream(path.join(__dirname, "files/small_file.txt"));
			let file2 = fs.createReadStream(path.join(__dirname, "files/empty.txt"));
			form.append("upload_img", file1);
			form.append("upload_img", file2);
			form.submit("http://localhost:5000", (err, res) => {
				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => {
					let req = JSON.parse(data);
					assert.equal(req.files.upload_img.size, 35);
					assert.equal(Object.keys(req.files).length, 1);
					done();
				});
			});
		});
	});
});

describe("Uploading invalid files to s3", function() {
	it("Uploading a file too big: Should not be in bucket and have an empty req.files", function(done) {
		this.timeout(4000);
		// http://localhost:5000
		createServer({
			store: "aws-s3",
			api: apiInfo,
			maxfileSize: 10000,
			filename: function() {
				return "too-big"
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

	it("Uploading a file too small: Should not be in bucket and have an empty req.files", function(done) {
		this.timeout(4000);
		// http://localhost:5000
		createServer({
			store: "aws-s3",
			api: apiInfo,
			minfileSize: 1000000000000,
			filename: function() {
				return "too-small";
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
			},
			filename: function(){
				return "ShouldEmpty";
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