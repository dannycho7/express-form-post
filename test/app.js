const express = require("express");
const path = require("path");
const logger = require("morgan");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const efp = require("../index"); // npm module
const formPost = efp({
	store: "disk", // Optional field; defaults to "disk-storage"
	directory: path.join(__dirname, "tmp"),
	validate: {
		maxfileSize: 10000
	},
	filename: function(filename, fieldname, mimetype) {
		return fieldname + '-' + filename;
	}
});

module.exports = (app) => {

	// app.use(logger("dev"));
	app.use(express.static(path.join(__dirname, "static")));
	app.set("view engine", "ejs");
	app.set("views", path.join(__dirname, "views"));
	app.use(formPost.middleware());

};