const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const efp = require("express-form-post");

// Basic usage example
// const formPost = efp();



/*
// Usage for disk
const formPost = efp({
	store: "disk", // Optional field; defaults to "disk-storage"
	directory: path.join(__dirname, "tmp"),
	maxfileSize: 1000000,
	filename: function(filename, fieldname, mimetype) {
		return Date.now() +  "-" + filename;
	},
	validate: function(fieldname, mimetype) {
		if(mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
			return false;
		}
		return true;
	}
});
*/
// Usage for s3
const formPost = efp({
	store: "aws-s3",
	filename: function(filename, fieldname) {
		return fieldname + "-" + filename;
	},
	keys: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.secretAccessKey,
		bucketName: process.env.S3_BUCKET_NAME,
		ACL: "public-read"
	}
});

/*
// Usage with google drive
const formPost = efp({
	store: "google-drive",
	maxfileSize: 100000,
	filename: function(filename, fieldname, mimetype) {

	},
	keys: {
		
	}
});
*/
module.exports = (app) => {

	app.use(express.static(path.join(__dirname, "static")));
	app.set("view engine", "ejs");
	app.set("views", path.join(__dirname, "views"));
	/* app.post("*", (req, res, next) => {	
		formPost.upload(req, res, (err) => {
			if(err) {
				console.log(err);
			}
			console.log("About to redirect?", req.files);
			res.redirect("/");
		});
	}); 
	*/
	app.use(formPost.middleware((err) => {
		if(err) console.log(err);

	}));

};