/**
 * Copyright 2014 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'),
  app = express(),
  request = require('request'),
  path = require('path'),
  bluemix = require('./config/bluemix'),
  validator = require('validator'),
  watson = require('watson-developer-cloud'),
  extend = require('util')._extend,
  fs = require('fs'),
  watsonPicture = require('./lib/twitter');

require('dotenv').load();

// Bootstrap application settings
require('./config/express')(app);

var username = process.env.USERNAME || '<username>';
var password = process.env.PASSWORD || '<password>';

// if bluemix credentials exists, then override local
var credentials = extend({
  version: 'v1',
  username: username,
  password: password
}, bluemix.getServiceCreds('visual_recognition')); // VCAP_SERVICES

// Create the service wrapper
var visualRecognition = watson.visual_recognition(credentials);

// render index page
app.get('/', function(req, res) {
	new watsonPicture().searchForAPicture(function(image) {
		if(image.indexOf('//') === 0) {
			image = image.replace('\/\/','http://');
		}
		res.render('index', { imageOfTheDay : image });
	});
});

app.post('/', function(req, res) {

  // Classifiers are 0 = all or a json = {label_groups:['<classifier-name>']}
  var classifier = req.body.classifier || '0';  // All
  if (classifier !== '0') {
    classifier = JSON.stringify({label_groups:[classifier]});
  }

  var imgFile;

  if (req.files.image) {
    // file image
    imgFile = fs.createReadStream(req.files.image.path);
  } else if(req.body.url && validator.isURL(req.body.url)) {
    // web image
    imgFile = request(req.body.url.split('?')[0]);
  } else if (req.body.url && req.body.url.indexOf('images') === 0) {
    // local image
    imgFile = fs.createReadStream(path.join('public',req.body.url));
  } else {
    // malformed url
    return res.status(500).json({ error: 'Malformed URL' });
  }

  var formData = {
    labels_to_check: classifier,
    image_file: imgFile
  };

  visualRecognition.recognize(formData, function(error, result) {
    if (error)
      return res.status(error.error ? error.error.code || 500 : 500).json({ error: error });
    else
      return res.json(result);
  });
});

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port, function() {
  console.log('Express server listening on port %d', port);
});
