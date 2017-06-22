const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const efp = require("express-form-post");

/*
// Quick start usage (defaults to disk)
const formPost = efp({
	directory: path.join(__dirname, "tmp"),
	filename: function(originalname, fieldname, mimetype) {
		return Date.now() + mimetype + "-" + originalname;
	},
	validateFile: function(cb, fieldname, mimetype) {
		if(mimetype != "application/pdf") {
			return cb(false);
		}
		return cb();
	},
	validateBody: function(cb, body) {
		if(body.test == "hello") {
			return cb(false);
		}
		return cb();
	}
});
*/

/*
// Usage for disk
const formPost = efp({
	store: "disk", // Optional field; defaults to "disk-storage"
	directory: path.join(__dirname, "tmp"),
	maxfileSize: 1000000,
	minfileSize: 1,
	filename: function(originalname, fieldname, mimetype) {
		return Date.now() +  "-" + originalname;
	},
	validateFile: function(fieldname, mimetype) {
		if(mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
			return cb(false);
		}
		return cb();
	},
	validateBody: function(body) {
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
	maxfileSize: 100000,
	filename: function(originalname, fieldname) {
		return fieldname + "-" + originalname;
	},
	api: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		bucketName: process.env.S3_BUCKET_NAME,
		ACL: "public-read"
	},
	validateBody: function(cb, body) {
		if(body.test == "hello") {
			return cb(false);
		} else {
			return cb();
		}
	}
});
*/

// Usage with dropbox
const formPost = efp({
	store: "dropbox",
	filename: function(originalname, fieldname, mimetype) {
		return Date.now() + originalname;
	},
	api: {
		accessToken: process.env.dropboxAccessToken,
	},
	validateBody: function(cb, body) {
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