/*
 * Sample usage with s3 storage and validation to only allow pdf uploads of maximum size 5mb
 * dependencies: aws-sdk, express, express-form-post
 */
const express = require("express");
const path = require("path");
const efp = require("express-form-post");
const formPost = efp({
	store: "aws-s3",
	maxfileSize: 1000000,
	filename: function(originalname, fieldname, mimetype) {
		return Date.now() + originalname;
	},
	validate: function(fieldname, mimetype) {
		if(mimetype != "application/pdf") {
			return false;
		}
	},
	api: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		bucketName: process.env.S3_BUCKET_NAME,
		ACL: "public-read"
	}
});

app.use(express.static(path.join(__dirname, "static")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.post("/upload", formPost.middleware(), (req, res, next) => {
	console.log("I just received files", req.files);
	res.send("Upload successful!");
});

/* the above code is equivalent to this

	app.post("/upload", (req, res, next) => {
		formPost.upload(req, res, () => {
			console.log("I just received files", req.files);
			res.send("Upload successful!");
		});
	});
*/




app.get("*", (req, res) => {
	res.render("index");
});

app.use((req, res) => {
	res.render("index");
	console.log("req.files: ", req.files);
	console.log("req.body: ", req.body);
});

app.listen(5000, () => {
	console.log("Test server listening in on port 5000");
});