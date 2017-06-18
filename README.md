# Express Form Post

A simple solution to handling file and form submissions <br/>

### Installation
```sh
$ npm install express-form-post --save
```

### Basic Usage Example:
The information for the file uploaded will be available in the files and body object in the request object.

### Quick Start:

```javascript
var express = require('express');
var app = express();
var efp = require('express-form-post');
var formPost = efp();

app.use(formPost.middleware());
```

### Disk Storage:

```javascript
var express = require('express');
var app = express();
var efp = require("express-form-post");
const formPost = efp({
	store: "disk",
	directory: path.join(__dirname, "tmp"),
	maxfileSize: 10000,
	filename: function(filename, fieldname, mimetype) {
		return Date.now() + '-' + filename;
	},
	validate: function(fieldname, filename, mimetype) {
		console.log(mimetype);
		if(mimetype != "application/pdf") {
			return false;
		}
	}
});

app.use(formPost.middleware(function(err) {
	if(err) console.log(err);
	console.log("Here are my files:", req.files);
}));
```

### Usage with S3: 

```sh
$ npm install aws-sdk --save
```

```javascript
var express = require('express');
var app = express();
var efp = require('express-form-post');
const formPost = efp({
	store: "aws-s3",
	maxfileSize: 100000,
	filename: function(filename, fieldname, mimetype) {
		return filename;
	},
	keys: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.secretAccessKey,
		bucketName: process.env.S3_BUCKET_NAME,
		ACL: "public-read"
	}
})

app.use(formPost.middleware(function(err) {
	if(err) console.log(err);
	console.log("Here are my files", req.files);
}));
```
### As a async function
```javascript
app.post("*", (req, res, next) => { 
	formPost.upload(req, res, (err) => {
		if(err) {
			console.log(err);
		}
		console.log("My files are located here:", req.files);
		res.redirect("/");
	});
}
```

## Available storage methods:
 * disk storage
 * aws s3

### Will be available soon:
 * google drive
 * dropbox