const express = require("express");
const app = express();
require("../app")(app); // Initializing middleware

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