# Express Form Post

A simple solution to handling file and form submissions <br/>

### Installation
```Installation
$ npm install express-form-post --save
```

### Basic Usage Example:
The information for the file uploaded will be available in the files and body object in the request object.

### Quick Start:

```
var express = require('express');
var app = express();
var formPost = require('express-form-post');
var formPostHandler = new formPost();

app.use(formPostHandler.default());
```

### Disk Storage: 
``` Disk storage
var express = require('express');
var app = express();
var efp = require("express-form-post");
var formPost = efp({
	store: "disk",
	directory: path.join(__dirname, "tmp"),
	maxfileSize: 10000,
	filename: function(filename, fieldname, mimetype) {
		return fieldname + '-' + filename;
	},
	validate: function(fieldname, filename, mimetype) {
		if(mimetype != "application/pdf") {
			return false;
		}
	}
});

app.use(formPost.middleware(function(err) {
	console.log(err);
}));
```

### Usage with S3: 

```
$ npm install aws-sdk --save
```

```
var express = require('express');
var app = express();
var efp = require('express-form-post');
const formPost = efp({
	store: "s3",
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
	console.log(err);
}));
```


## Available storage methods:
 * disk storage
 * aws s3

### Will be available soon:
 * google drive
 * dropbox