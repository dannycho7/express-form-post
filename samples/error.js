/*
 * Sample usage as middleware with handling errors in express.js
 */
const express = require("express");
const app = express();
const efp = require("express-form-post");
const formPost = efp();

app.post("/upload", formPost.middleware(), (req, res, next) => {
	console.log("Received files", req.files);
});

app.use((err, req, res, next) => {
	console.log("Recieved error from express-form-post middleware", err);
});

app.listen(5000, () => {
	console.log("Test server listening in on port 5000");
});