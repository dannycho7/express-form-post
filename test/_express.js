/* eslint-env node, mocha */
/* Creating a x time request express server which closes as soon as it gets x requests */
/* Response will always be the req object so we can just check the req body and req files */

const express = require("express");
const efp = require("../index.js");

module.exports = (opts, selfRequest, x = 1) => {
	let counter = 0;
	var app = express();
	const formPost = new efp(opts);

	app.use(formPost.middleware());
	app.use((req, res) => {
		let responseJSON = {
			files: req.files,
			body: req.body,
			opts: opts
		}
		res.send(JSON.stringify(responseJSON));
		if(++counter >= x) {
			server.close();
		}
	});

	var server = app.listen(5000, () => {});
	selfRequest(); // uses form-data api to initiate req to self
};
