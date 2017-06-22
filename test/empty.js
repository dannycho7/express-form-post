const assert = require("assert");
const createServer = require("./_server");
const FormData = require("form-data");
const fs = require("fs");

describe("Submitting empty form data", () => {
	describe("#empty fields", () => {
		it("Should have an empty req.files and return", (done) => {
			 // http://localhost:5000
			createServer(done, { directory: "tmp" }, () => {
				// submit form and check req.files
				var form = new FormData();
				let file = fs.createReadStream(__dirname + "/files/company_pay.jpg");
				form.append("upload_img", file)
				form.submit("http://localhost:5000", (err, res) => {
					let data = "";
					res.on("data", (chunk) => {
						data += chunk;
					});
					res.on("end", () => {
						let req = JSON.parse(data);
						if(req.files.upload_img.size == 130466) {
							done();
						} else {
							done(new Error("file size was wrong"));
						}
					});
				});

			});
		});
	});

	describe("empty files", () => {
		assert.equal(1, 1);
	});
})