module.exports.create = (resolve, reject) => {
	return (validFlag) => {
		if(validFlag == true || validFlag == undefined || validFlag == null) return resolve();
		if(validFlag instanceof Error) {
			reject(validFlag);
		} else if(validFlag == false) {
			reject(new Error("Validation error by custom validateFile function"));
		} else {
			reject(new Error(validFlag));
		}
	};
};