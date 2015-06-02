var Twitter = require('twitter'),
	moment = require('moment'),
	request = require('request'),
	twitter_text = require('twitter-text'),
	cheerio = require('cheerio'),
	_ = require('underscore'),
	Log = require('log');

require('dotenv').load();
var log = new Log('info');

var consumer_key = process.env.CONSUMER_KEY || '';
var consumer_secret = process.env.CONSUMER_SECRET || '';
var access_token_key = process.env.ACCESS_TOKEN_KEY || '';
var access_token_secret = process.env.ACCESS_TOKEN_SECRET || '';


var WatsonPicture = function() {
	this.client = new Twitter({
		consumer_key: consumer_key,
		consumer_secret: consumer_secret,
		access_token_key: access_token_key,
		access_token_secret: access_token_secret
	});
};

WatsonPicture.prototype.searchForAPicture = function(callback) {
	var now = moment().format('YYYY-MM-DD');

	var query = '#watsonfun from:topcoderupdates';
	this.client.get('search/tweets', {'q': query}, function(error, result) {
		if (error)
		{
			log.error('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
		}

		if (result)
		{
			var text = result.statuses[0].text;
			var links = twitter_text.extractUrls(text);
			var pictureLink = links[0];
			request(pictureLink, function(error, response, body) {
				$ = cheerio.load(body);
				var images = $('img');
				var biggestImage = _.max(images, function(image) {
					if(image.attribs.width) {
						return image.attribs.width;
					}

					return -1;
				});
				callback(biggestImage.attribs.src);
			});
		}
	});
}

module.exports = WatsonPicture;
