module.exports.create = (resolve, reject) => {
	return (validFlag) => {
		if(validFlag == false) {
			reject(new Error("Validation error by custom validateFile function"));
		} else if(validFlag instanceof Error) {
			reject(validFlag);
		} else {
			resolve();
		}
	};
}