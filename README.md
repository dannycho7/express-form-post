# Express Form Post [![npm version](https://badge.fury.io/js/express-form-post.svg)](https://badge.fury.io/js/express-form-post) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

A simple solution to handling file and form submissions <br/>
Note: this is not recommended for use by applications that handle large files. This is a quick solution to any application that handle small to medium sized files.

## Installation
```sh
$ npm install express-form-post --save
```

## Usage

The information for the file uploaded will be available in the `files` and `body` object in the `request` object. express-form-post can be dropped in as middleware or used as a function to handle file upload. 

## Quick Start

```javascript
var express = require("express");
var app = express();
var efp = require("express-form-post");
var formPost = efp();

app.use(formPost.middleware());
```

## Disk Storage

```javascript
var express = require("express");
var app = express();
var efp = require("express-form-post");
const formPost = efp({
	store: "disk",
	directory: path.join(__dirname, "tmp"),
	maxfileSize: 10000,
	filename: function(originalname, fieldname, mimetype) {
		return Date.now() + "-" + originalname;
	},
	validate: function(fieldname, originalname, mimetype) {
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

## Usage with S3

```sh
$ npm install aws-sdk --save
```

```javascript
var express = require("express");
var app = express();
var efp = require("express-form-post");
const formPost = efp({
	store: "aws-s3",
	maxfileSize: 100000,
	filename: function(originalname, fieldname, mimetype) {
		return originalname;
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
## As a async function
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

## API

Further API documentation will be implemented soon.

#### efp(opts)

express-form-post accepts an "optional" options parameter

Key | Description | Note
--- | --- | ---
`store` | The type of store | check below for available store methods
`directory` | The folder to which the file will be saved | defaults to current directory
`filename` | function to determine file save name | defaults to the file's name on the user's computer
`maxfileSize` | Maximum Size of the uploaded file in bytes | defaults to infiniti
`minfileSize` | Minimum Size of the uploaded file in bytes | defaults to 0
`validate` | function to validate uploaded file |
`keys` | The name of the file within the `destination` | `used for cloud storage`


## Available storage methods
 * disk storage
 * aws s3

### Will be available soon
 * google drive
 * dropbox
