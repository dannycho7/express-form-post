/*
 * Sample usage with s3 storage and validation to only allow pdf uploads of maximum size 1mb
 * It also does a small validation of check if the person who submitted the form inputted name "henry"
 * dependencies: aws-sdk, express, express-form-post
 */
const express = require("express");
const app = express();
const path = require("path");
const efp = require("express-form-post");
const formPost = efp({
	directory: path.join(__dirname, "tmp"),
	maxfileSize: 1000000,
	filename: function(req, file, cb) {
		cb(Date.now() + file.originalname);
	},
	validateBody: function(body, cb) {
		if(body.name == "henry") {
			return cb(false);
		}
		cb();
	},
	validateFile: function(file, cb) {
		if(file.mimetype != "application/pdf") {
			return cb(false);
		}
		cb();
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
			console.log("I also received the fields", req.body);
			res.send("Upload successful!");			
		}
	});
});


app.get("*", (req, res) => {
	res.render("index");
});

app.listen(5000, () => {
	console.log("Test server listening in on port 5000");
});