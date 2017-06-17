const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const efp = require("express-form-post");

/*
// Basic usage example
const formPost = efp();
*/


// Usage for disk
const formPost = efp({
	store: "disk", // Optional field; defaults to "disk-storage"
	directory: path.join(__dirname, "tmp"),
	maxfileSize: 10000,
	filename: function(filename, fieldname, mimetype) {
		return fieldname + '-' + filename;
	},
	validate: function(fieldname, filename, mimetype) {

	}
});

/*
// Usage for s3
const formPost = efp({
	store: "s3",
	maxfileSize: 10000,
	filename: function(filename, fieldname, mimetype) {

	},
	keys: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.secretAccessKey,
		bucketName: process.env.S3_BUCKET_NAME,
		ACL: "public-read"
	}
});
*/

module.exports = (app) => {

	app.use(express.static(path.join(__dirname, "static")));
	app.set("view engine", "ejs");
	app.set("views", path.join(__dirname, "views"));
	app.use(formPost.middleware(function(err) {
		console.log(err);
	}));

};