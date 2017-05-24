var formPost = (options) => {
	return require('./lib/express-form-post')(options);
}

module.exports = formPost;