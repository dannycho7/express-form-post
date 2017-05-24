var formPost = (path) => {
	return require('./lib/fileupload')(path);
}

module.exports = formPost;