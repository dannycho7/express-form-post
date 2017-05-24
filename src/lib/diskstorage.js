const concat = require('concat-stream');
const fs = require('fs');

module.exports = (save_path) => {
	return concat((data) => {
		let writeStream = fs.createWriteStream(save_path);
		writeStream.write(data, () => {
			console.log("Successfully saved file to", save_path);
		});
	});
}
