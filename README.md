# Express Form Post 
[![npm version](https://badge.fury.io/js/express-form-post.svg)](https://badge.fury.io/js/express-form-post) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard) [![npm](https://img.shields.io/npm/dt/express-form-post.svg)]()

**A simple and efficient solution to handling file and form submissions**

**Note: This module works in any node.js setting. Express is not required for usage.**

Many bugs were addressed in v1.1.4, so if you have an older version please consider switching to the latest.


## Why use this module?
 * Easy setup
 	* abstracts set up for both dropbox and aws-s3 multipart uploads
 * Validation for the entire request body before finalizing uploads
 	* Other modules only offer validation based on file size or metadata
 	* Perfect for applications that require uploads on signup and those looking to save api requests
 	* This makes efp faster as it can abort the file upload if you invalidate the request body
 * Pipes buffer streams to api endpoints making it a very fast and memory efficient file uploader


## Installation
```sh
$ npm install express-form-post --save
```

## Usage

The information for the uploaded file will be available in the `files` object in the `request` object. Fields that were sent along the request will be available on the`body` object in the `request` object. express-form-post can be dropped in as middleware or used as a function to handle file upload. Check out the samples on the [github](https://github.com/dannycho7/express-form-post) repository for more specific usage!

## Quick Start with express.js

```javascript
var express = require("express");
var app = express();
var efp = require("express-form-post");
var formPost = efp();

app.use(formPost.middleware());
```

## Usage as an asynchronous function (Highly Recommended)
You can also use express-form-post's method 'upload' instead of the middleware method. It is a more intuitive way of handling the upload. I would recommend using this if you want to handle errors in any sophisticated way (if you're doing something more than just logging the error).

**This allows you to use express-form-post without express routing**

```javascript
var express = require("express");
var app = express();
var efp = require("express-form-post");
var formPost = efp();

app.post("/upload", function(req, res, next) { 
	formPost.upload(req, res, function(err) {
		if(err) {
			console.log(err);
		}
		console.log("My files are located here:", req.files);
		res.redirect("/");
	});
}
```

## Usage with Disk Storage

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
	validateFile: function(cb, fieldname, mimetype) {
		console.log(mimetype);
		if(mimetype != "application/pdf") {
			return cb(false);
		}
		return cb();
	},
	validateBody: function(cb, body) {
		// validates password length before uploading file
		if(body.password.length > 7) {
			return cb(false);
		}
		cb();
	}
});

app.post("/upload", formPost.middleware(), function(req, res, next) {
	console.log("I just received files", req.files);
	res.send("Upload successful!");
});
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

app.post("/upload", formPost.middleware(), function(req, res, next) {
	console.log("I just received files", req.files);
	res.send("Upload successful!");
});
```

## Usage with dropbox

```sh
$ npm install dropbox dropbox-stream --save
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

## API

When initializing an instance of efp (express-form-post)  you can provide it different options that will change the way efp handles your file uploads. 

#### express-form-post([opts])

express-form-post accepts an "optional" options parameter list. Keep in mind all fields are OPTIONAL. If you don't provide any, the express-form-post api will take care of that using the default options.

Key | Description | Note
--- | --- | ---
`store` | The type of store | check below for available store methods
`directory` | The folder to which the file will be saved | defaults to current directory
`filename` | function to determine file save name | defaults to the a unique 64 bit hash generated by `hasha`
`maxfileSize` | Maximum Size of the uploaded file in bytes | defaults to infiniti
`minfileSize` | Minimum Size of the uploaded file in bytes | defaults to 0
`validateFile` | function to validate uploaded file | takes two optional parameters: fieldname and mimetype 
`validateBody` | function to validate the body of the request before storing the validated file | request body is the parameter
`api` | api configuration information (api keys) | read further documentation for specifications 

## Validation

One of the advantages of using express-form-post to handle file uploads is the validation api. There are two (optional) validation methods available during setup: validateFile and validateBody. <br/>

If specifying a validation method property, you must call the callback argument or your file will go unhandled.

Both validate functions were designed to be an intuitive way to create conditional file handling. In order to invalidate a request/file upload, you just need to return the callback with the argument false. Examples are listed below.

#### validateBody(callback, body)
The validateBody method validates the request's body before sending off your file to the specified store. This is especially helpful for handling signups that require uploading some type of file (e.g a resume). For example, if the user signs up without filling in the proper fields, you can cancel the file upload (saves api requests and creates faster responses for errors). Here is an example with validating that a field called 'username' was sent.

```javascript
const formPost = efp({
	validateBody: function(cb, body) {
		if(body.username == undefined) {
			return cb(false);
		}
		cb();
	}
});
```

#### validateFile(fieldname, mimetype)
The validateFile method validates the file data itself. An example use case would be checking if the file is a pdf. This particular example is listed below.

```javascript
const formPost = efp({
	validateFile: function(fieldname, mimetype) {
		if(mimetype != "application/pdf") {
			return cb(false);
		} else {
			cb();
		}
	}
});
```

## Available storage methods
 * disk
 * aws s3
 * dropbox

### Storage handlers

There are three different ways to handle form data with express-form-post. The three ways are available as methods in the instance of a express-form-post object.

#### upload(request, response[, callback])
This method is used inside routes as a function rather than middleware. This allows better readability and customizability. This function takes in three parameters : request, response, and an optional callback. The request and response object should be the ones provided by express.

#### middleware([callback])
This method is used as middleware and provides a good layer of abstraction for file handling.

#### fields
This method is used to only parse the fields and ignore the files. I would recommend against using this and to use `body-parser` instead, but fields is available for those who are not looking to download multiple modules that do the same.

### Configuring cloud storage

Here are the different information you can input for each api storage. These options would go inside the api property of the options listed above.

#### aws-s3
Key | Description | Note
--- | --- | ---
`accessKeyId` | AWS access key id | **Required** You can find it here : [aws console](https://aws.amazon.com/console/)
`secretAccessKey` | secret key for aws | Optional based on your s3 settings
`bucketName` | The name of your bucket. | **Required**
`ACL` | Access control list  | Privacy control. Defaults to "private"


#### dropbox

Key | Description | Note
--- | --- | ---
`accessToken` | used by Dropbox to identify your app | **Required** Check out the [docs](https://www.dropbox.com/developers)
`clientId` | Dropbox client Id | Optional
`selectUser` | Specific user in a team box | Optional


## Samples

Samples are also available on the github page. Please take a look and reach out if you have any questions: [github](https://github.com/dannycho7/express-form-post)