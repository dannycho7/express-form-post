const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const efp = require("express-form-post");

/*
// Quick start usage (defaults to disk)
const formPost = efp({
	directory: path.join(__dirname, "tmp"),
	minfileSize: 10
});
*/

/*
// Usage for disk
const formPost = efp({
	store: "disk", // Optional field; defaults to "disk-storage"
	directory: path.join(__dirname, "tmp"),
	maxfileSize: 1000000,
	minfileSize: 1,
	filename: function(req, file, cb) {
		cb(Date.now() +  "-" + file.originalname);
	},
	validateFile: function(file, cb) {
		if(file.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
			return cb(false);
		}
		return cb();
	},
	validateBody: function(body, cb) {
		if(body.test == "hello") {
			return cb(false);
		}
		cb();
	}
});
*/

/*
// Usage for s3
const formPost = efp({
	store: "aws-s3",
	validateBody: function(body, cb) {
		if(body.test != "") return cb(false);
		return cb();
	},
	filename: function(req, file, cb) {
		cb(file.fieldname + file.originalname);
	},
	api: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		bucketName: process.env.S3_BUCKET_NAME,
		ACL: "public-read"
	}
});
*/


// Usage with dropbox
const formPost = efp({
	store: "dropbox",
	filename: function(req, file, cb) {
		cb(Date.now() + file.originalname);
	},
	api: {
		accessToken: process.env.dropboxAccessToken,
	},
	validateBody: function(body, cb) {
		if(body.test == "hello") {
			return cb(false);
		} else {
			return cb();
		}
	}
});

module.exports = (app) => {

	app.use(express.static(path.join(__dirname, "static")));
	app.set("view engine", "ejs");
	app.set("views", path.join(__dirname, "views"));
	app.post("*", (req, res, next) => {	
		formPost.upload(req, res, (err) => {
			if(err) {
				console.log(err);
			}
			next();
		});
	}); 
	
	/* app.use(formPost.middleware((err) => {
		console.log(err);
	})); */
};