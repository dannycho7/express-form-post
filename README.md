# Express Form Post [![npm version](https://badge.fury.io/js/express-form-post.svg)](https://badge.fury.io/js/express-form-post) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

A simple solution to handling file and form submissions <br/>
Note: this is not recommended for use by applications that handle large files or receives a large volume of file upload requests. This is a quick solution to any application that handle small to medium sized files intended to be an abstraction for applications whose core doesn't come from file uploading.

## Installation
```sh
$ npm install express-form-post --save
```

## Usage

The information for the file uploaded will be available in the `files` and `body` object in the `request` object. express-form-post can be dropped in as middleware or used as a function to handle file upload. Check out the samples on the github repository for more specific usage!

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

## Usage with aws-s3

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
	api: {
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

## Usage with dropbox

```sh
$ npm install dropbox --save
```

```javascript
var express = require("express");
var app = express();
var efp = require("express-form-post");
const formPost = efp({
	store: "dropbox",
	filename: function(originalname, fieldname, mimetype) {
		return originalname;
	},
	api: {
		accessToken: process.env.dropboxAccessToken
	}
});

app.use(formPost.middleware(function(err) {
	if(err) console.log(err);
	console.log("Here are my files", req.files);
}));
```

## usage as an asynchronous function
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

## express-form-post API

When initializing an instance of efp (express-form-post)  you can provide it different options that will change the way efp handles your file uploads. 

#### express-form-post(opts)

express-form-post accepts an "optional" options parameter list. Keep in mind all fields are OPTIONAL. If you don't provide any, the express-form-post api will take care of that using the default options.

Key | Description | Note
--- | --- | ---
`store` | The type of store | check below for available store methods
`directory` | The folder to which the file will be saved | defaults to current directory
`filename` | function to determine file save name | defaults to the file's name on the user's computer
`maxfileSize` | Maximum Size of the uploaded file in bytes | defaults to infiniti
`minfileSize` | Minimum Size of the uploaded file in bytes | defaults to 0
`validate` | function to validate uploaded file |
`api` | api configuration information (api keys) | read further documentation for specifications

## Available storage methods
 * disk storage
 * aws s3
 * dropbox

### Configuring API storage

Here are the different information you can input for each api storage. These options would go inside the api property of the options listed above.

#### aws-s3
Key | Description | Note
--- | --- | ---
`accessKeyId` | AWS access key id | This is required. You can find it here : [aws console](https://aws.amazon.com/console/)
`secretAccessKey` | secret key for aws | Optional based on your s3 settings
`bucketName` | The name of your bucket. | This is required.
`ACL` | Access control list  | Privacy control. Defaults to "private"


#### dropbox

Key | Description | Note
--- | --- | ---
`accessToken` | used by Dropbox to identify your app | This is required. Check out the [docs](https://www.dropbox.com/developers)
`clientId` | Dropbox client Id | Optional
`selectUser` | Specific user in a team box | Optional
