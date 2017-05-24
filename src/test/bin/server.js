const express = require('express');
const app = express();
require("../app")(app); // Initializing middleware

app.get("*", (req, res, next) => {
	res.render('index');
});

app.use((req, res, next) => {
	res.render('index');
});

app.listen(5000, () => {
	console.log("Test server listening in on port 5000");
});