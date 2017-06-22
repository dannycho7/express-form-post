const assert = require("assert");
const createServer = require("./_server");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");


describe("Submitting empty form data", () => {
	describe("#empty files", () => {
		it("Should have an empty req.files and return", function(done) {
			// http://localhost:5000
			createServer({
				directory: path.join(__dirname, "tmp")
			}, () => {
				// submit form and check req.files
				var form = new FormData();
				form.append("username", "dannycho7");
				form.append("password", "1234");
				form.submit("http://localhost:5000", (err, res) => {
					let data = "";
					res.on("data", (chunk) => {
						data += chunk;
					});
					res.on("end", () => {
						let req = JSON.parse(data);
						assert.equal(req.body.username, "dannycho7");
						assert.equal(req.body.password, "1234");
						assert.equal(Object.keys(req.files).length, 0);
						done();
					});
				});
			});
		});
		
		it("This empty file should have been uploaded", function(done) {
			// http://localhost:5000
			createServer({
				directory: path.join(__dirname, "tmp"),
				filename: function(originalname, fieldname) {
					return fieldname + "-" + originalname;
				}
			}, () => {
				var form = new FormData(done);
				form.append("username", "dannycho7");
				form.append("file", fs.createReadStream(path.join(__dirname, "files/empty.txt")));
				form.submit("http://localhost:5000", (err, res) => {
					let data = "";
					res.on("data", (chunk) => {
						data += chunk;
					});
					res.on("end", () => {
						let req = JSON.parse(data);
						assert.notEqual(Object.keys(req.files).length, 0);
						assert.equal(req.files.file.path, path.join(__dirname, "tmp/file-empty.txt"));
						done();
					});
				});
			});
		});
	});

	describe("#empty fields", () => {
		it("Uploading empty fields and no file", (done) => {
			// http://localhost:5000
			createServer({}, () => {
				var form = new FormData();
				form.append("empty1", "");
				form.append("empty2", "");
				form.append("name", "dannycho7");
				form.submit("http://localhost:5000", (err, res) => {
					let data = "";
					res.on("data", (chunk) => {
						data += chunk;
					});
					res.on("end", () => {
						let req = JSON.parse(data);
						assert.equal(req.body.empty1, "");
						assert.equal(req.body.empty2, "");
						assert.equal(req.body.name, "dannycho7");
						done();
					}); 
				});
			});
		});
	});

})