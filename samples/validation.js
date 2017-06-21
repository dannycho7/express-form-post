/*
 * Sample usage with s3 storage and validation to only allow pdf uploads of maximum size 5mb
 * dependencies: aws-sdk, express, express-form-post
 */
const express = require("express");
const app = express();
const path = require("path");
const efp = require("express-form-post");
const formPost = efp({
	store: "aws-s3",
	maxfileSize: 1000000,
	filename: function(originalname, fieldname, mimetype) {
		return Date.now() + originalname;
	},
	validateBody: function(body) {
		if(body.name == "henry") {
			return false;
		}
	},
	validateFile: function(cb, fieldname, mimetype) {
		if(mimetype != "application/pdf") {
			return cb(false);
		}
		cb();
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

app.post("/upload", (req, res, next) => {
	formPost.upload(req, res, function(err) {
		if(err) {
			console.log("Did not successfully authenticate upload", err);
			return res.send("Upload unsuccessful");
		} else {
			console.log("I just received files", req.files);
			res.send("Upload successful!");			
		}
	});
});


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