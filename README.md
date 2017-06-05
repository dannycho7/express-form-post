# Express Form Post

A simple solution to handling file and form submissions <br/>

### Installation
```Installation
$ npm install express-form-post --save
```

### Basic Usage Example:
```
var express = require('express');
var app = express();
var formPost = require('express-form-post');
var formPostHandler = new formPost();

app.use(formPostHandler.default());
```

### Usage with S3: 
```
var express = require('express');
var app = express();
var formPost = require('express-form-post');
var formPostHandler = new formPost({
  method: 's3-storage',
  directory: 'tmp',
  keys: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucketName: process.env.S3_BUCKET_NAME
  },
  maxfileSize: 1000000
});

app.use(formPostHandler.default());
```



## Available storage methods:
 * disk storage
 * aws s3

### Will be available soon:
 * google drive
 * dropbox