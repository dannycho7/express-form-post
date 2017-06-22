/* Creating a one time request server which closes as soon as it gets one request */
/* Response will always be the req object so we can just check the req body and req files */

const http = require("http");
const efp = require("../index.js");

module.exports = (done, opts, selfRequest) => {
	var server = http.createServer();
	const formPost = new efp(opts);

	server.on("request", (req, res) => {
		formPost.upload(req, res, (err) => {
			if(err) return done(err);
			let responseJSON = {
				files: req.files,
				body: req.body
			}
			res.writeHead(200, { Connection: 'close' });
			res.end(JSON.stringify(responseJSON));
			server.close();
		});
	});

	server.listen(5000, () => {});
	selfRequest(); // uses form-data api to send a request to this server
}
