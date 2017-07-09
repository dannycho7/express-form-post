/* eslint-env node, mocha */

const assert = require("assert");
const createServer = require("./_server");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

describe("Uploading invalid files", function() {
	it("Uploading jpg when it should be pdf", function(done) {
		// http://localhost:5000
		createServer({
			directory: path.join(__dirname, "tmp"),
			validateFile: function(file, cb) {
				if(file.mimetype != "application/pdf") {
					return cb(false);
				}
				cb();
			},
			filename: function(req, file, cb) {
				cb("jpgNotPDF");
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
					assert.deepEqual(req.body, {});
					fs.stat(path.join(__dirname, "files/jpgNotPDF"), (err, stats) => {
						if(err) return done();
						if(stats.isFile()) return done(new Error("File should not have been saved"));
						return done();
					});
				});
			});
		});
	});

	it("Calling cb on validate more than once. Should be no problem and req.files should have one item", function(done) {
		// http://localhost:5000
		createServer({
			directory: path.join(__dirname, "tmp"),
			validateFile: function(file, cb) {
				cb();
				cb(false);
				cb(false);
				cb(false);
			},
			filename: function(req, file, cb) {
				cb("validateMoreThanOnce");
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
					assert.equal(req.files.upload_img.size, 130466);
					fs.stat(path.join(__dirname, "tmp/validateMoreThanOnce"), (err, stats) => {
						if(err) return done(err);
						if(stats.isFile) return done();
						return done(new Error("File was not uploaded"));
					});
				});
			});
		});
	});

	it("Invalid multiple calls to both validate methods; file should still be uploaded", function(done) {
		// http://localhost:5000
		createServer({
			directory: path.join(__dirname, "tmp"),
			filename: function(req, file, cb) {
				cb("invalidBodies");
			},
			validateBody: function(body, cb) {
				cb();
				cb(false);
				cb(false);
			},
			validateFile: function(file, cb) {
				cb();
				cb(false);
				cb();
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
					assert.deepEqual(req.body, {});
					assert.equal(Object.keys(req.files).length, 1);
					fs.stat(path.join(__dirname, "tmp/invalidBodies"), (err, stats) => {
						if(err) return done(err);
						if(stats.isFile()) return done();
						done(new Error("File was not uploaded"));
					});
				});
			});
		});
	});

	it("Invalid body should not have uploaded the files", function(done) {
		// http://localhost:5000
		createServer({
			directory: path.join(__dirname, "tmp"),
			filename: function(req, file, cb) {
				cb("invalidBody");
			},
			validateBody: function(body, cb) {
				return cb(false);
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
					assert.deepEqual(req.body, {});
					assert.deepEqual(req.files, {});
					setTimeout(() => {
						fs.stat(path.join(__dirname, "tmp/invalidBody"), (err, stats) => {
							if(err) return done();
							if(stats.isFile()) return done(new Error("File was actually uploaded"));
							done();
						});
					});
				});
			});
		});
	});
});

describe("Uploading large files", function() {
	before(function() {
		// skipping this test because this is so costly. comment the method if you want to use this test
		// this.skip(); 
	});

	it("Uploading just one large file. should update req.files", function(done) {
		done();
	});

	it("Should have updated req.files", function(done) {
		this.timeout(5000);
		// http://localhost:5000
		createServer({
			directory: path.join(__dirname, "tmp"),
			filename: function(req, file, cb) {
				cb(file.fieldname + "-" + file.originalname);
			}
		}, () => {
			// submit form and check req.files
			var form = new FormData();
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
					fs.stat(path.join(__dirname, "tmp/upload_img-large_image.JPG"), (err, stats) => {
						if(err) return done(err);
						if(stats.isFile()) {
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
									assert.equal(req.files.upload_img.size, 130466);
									fs.stat(path.join(__dirname, "tmp/upload_img-medium_image.jpg"), (err, stats) => {
										if(err) return done(err);
										if(stats.isFile()) {
											return done();
										}
										return done(new Error("Second file did not save"));
									});
								});
							});
						} else {
							return done(new Error("First file did not save"));
						}
					});
				});
			});
		}, 2);
	});
});