const assert = require("assert");
const efp = require("../../index");
const { DUMMY_S3_API_CREDENTIALS } = require("../constants");

describe("Creating efp instance with different options", () => {
	describe("#validateFile", () => {
		it("Should throw an error if validateFile is specified and not a function", () => {
			assert.throws(() => {
				let formPost = efp({
					validateFile: 1
				});
			}, (err) => {
				assert.equal(err.message, "option 'validateFile' must be a function.");
				return true;
			});
		});
	});

	describe("#validateBody", () => {
		it("Should throw an error if validateBody is specified and not a function", () => {
			assert.throws(() => {
				let formPost = efp({
					validateBody: 1
				});
			}, (err) => {
				assert.equal(err.message, "option 'validateBody' must be a function.");
				return true;
			});
		});
	});

	describe("#store", () => {
		it("Should allow initialize with supported store", () => {
			assert.doesNotThrow(() => {
				let formPost = efp({
					store: "aws-s3",
					api: DUMMY_S3_API_CREDENTIALS
				});
			}, (err) => console.log(err));
		});

		it("Should throw an error if store is not one of the supported stores", () => {
			assert.throws(() => {
				let formPost = efp({
					store: 1
				});
			}, (err) => {
				let expected_msg = "storage 1 is not supported by express-form-post.\n\tCurrently available: ['disk', 'aws-s3', 'dropbox']";
				assert.equal(err.message, expected_msg);
				return true;
			});
		});

		it("Should throw an error if store is an api store but does not specify api options", () => {
			assert.throws(() => {
				let formPost = efp({
					store: "aws-s3"
				});
			}, (err) => {
				assert.equal(err.message, "You must specify api information to use aws-s3 storage");
				return true;
			});

			assert.doesNotThrow(() => {
				let formPost = efp({
					store: "disk"
				});
			}, (err) => console.log(err));
		});
	});

	describe("#fileSize", () => {
		it("minfileSize should take either a number or an object", () => {
			assert.doesNotThrow(() => {
				let formPostNumber = efp({
					minfileSize: 10
				});

				let formPostObj = efp({
					minfileSize: { size: 10 }
				});
			});
		});

		it("should raise error when minfileSize is anything other than a number or an object", () => {
			assert.throws(() => {
				let formPost = efp({
					minfileSize: false
				});
			});
		});
	});
});
