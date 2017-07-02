/* eslint-env node, mocha */
/* Creating a x time request server which closes as soon as it gets x requests */
/* Response will always be the req object so we can just check the req body and req files */

const http = require("http");
const efp = require("../index.js");
const fs = require("fs");
const path = require("path");

module.exports = (opts, selfRequest, x = 1, wait = 0, cbWait = () => {} ) => {
	let counter = 0;
	var server = http.createServer();
	const formPost = new efp(opts);

	server.on("request", (req, res) => {
		formPost.upload(req, res, (err) => {
			if(err) console.log("Error by server", err.message);
			let responseJSON = {
				files: req.files,
				body: req.body,
				opts: opts
			};
			res.writeHead(200, { Connection: "close" });
			res.end(JSON.stringify(responseJSON));
			if(++counter >= x) {
				if(wait == 0) return server.close();
				setTimeout(() => {
					server.close();
					cbWait();
				}, wait);
			}
		});
	});

	server.listen(5000, () => {});
	selfRequest(); // uses form-data api to initiate req to self
};
