var Twitter = require('twitter');
var config = require('./config.js');
var fs = require('fs');

var twitter = new Twitter(config);

var params = {screen_name: '500_headlines', count: 250, trim_user: true, exclude_replies: true};
twitter.get('statuses/user_timeline', params, function(error, content, response) {
  if(error) throw error;

  const hoursSinceLastTweet = getHoursSinceLastTweet(content);

  console.log(`last tweet ${hoursSinceLastTweet} hours ago`);

  if (hoursSinceLastTweet > 17.25) {
    console.log(`timeline has ${content.length} tweets`);

    var headline = getNewHeadline(content);

    console.log(`update: ${headline}`);

    twitter.post('statuses/update', {status: headline},  function(error, tweet, response) {
      if(error) throw error;
      console.log(`${response.statusCode} ${response.statusMessage}`);
      console.log(`tweet id ${tweet.id}`);
    });
  }
});

function getNewHeadline(content) {
  var headlines = readHeadlines();

  var tweets = content.map(tweet => tweet.text);

  while(true) {
    var n = Math.floor(Math.random() * headlines.length);
    var headline = headlines[n];
    if (tweets.indexOf(headline) == -1) {
      return headline;
    }
  }
}

function getHoursSinceLastTweet(content) {
  return ((new Date() - Date.parse(content[0].created_at)) / 1000 / 60 / 60).toFixed(1);
}

function readHeadlines() {
  var contents = fs.readFileSync('500.txt', 'utf8');
  return contents.split('\n');
}
