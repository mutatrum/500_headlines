var Twitter = require('twitter');
var config = require('./config.js');
var fs = require('fs');

var twitter = new Twitter(config);

var params = {screen_name: '500_headlines', count: 250, trim_user: true, exclude_replies: true};
twitter.get('statuses/user_timeline', params, function(error, content, response) {
  if(error) throw error;

  var headlines = readHeadlines();

  var tweets = content.map(tweet => tweet.text);
  
  const hoursSinceLastTweet = getHoursSinceLastTweet(headlines, content);

  console.log(`last tweet ${hoursSinceLastTweet} hours ago`);

  if (hoursSinceLastTweet > 17.25) {
    console.log(`timeline has ${content.length} tweets`);

    var headline = getNewHeadline(tweets, headlines);

    console.log(`update: ${headline}`);

    twitter.post('statuses/update', {status: headline},  function(error, tweet, response) {
      if(error) throw error;
      console.log(`${response.statusCode} ${response.statusMessage}`);
      console.log(`tweet id ${tweet.id}`);
    });
  }
});

function getNewHeadline(tweets, headlines) {
  while(true) {
    var n = Math.floor(Math.random() * headlines.length);
    var headline = headlines[n];
    if (tweets.indexOf(headline) == -1) {
      return headline;
    }
  }
}

function getHoursSinceLastTweet(headlines, content) {
  var i = 0;
  while(headlines.indexOf(content[i].text) == -1) {
    console.log(`Skip tweet ${content[i].text}`);
    i++;
  }
  return ((new Date() - Date.parse(content[i].created_at)) / 1000 / 60 / 60).toFixed(1);
}

function readHeadlines() {
  var contents = fs.readFileSync('500.txt', 'utf8');
  return contents.split('\n');
}
