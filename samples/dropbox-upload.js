/*
 * Sample usage with dropbox storage
 * dependencies: dropbox, express, express-form-post
 */
const express = require("express");
const path = require("path");
const efp = require("express-form-post");
const formPost = efp({
	store: "dropbox",
	filename: function(originalname, fieldname, mimetype) {
		return Date.now() + originalname;
	},
	api: {
		accessToken: process.env.dropboxAccessToken
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