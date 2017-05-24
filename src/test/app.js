const formPost = require('../index'); // npm module
const express = require('express');
const path = require('path');

module.exports = (app) => {

	app.use(express.static(path.join(__dirname, "static")));
	app.set('view engine', 'ejs');
	app.set('views', path.join(__dirname, "views"));
	app.use(formPost({
		directory: path.join(__dirname, "tmp"),
		maxfileSize: 1000000
	}));

}