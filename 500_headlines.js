require('log-timestamp');
const cron = require('node-cron');
const Twitter = require('twitter');
const config = require('./config.js');
const fs = require('fs');

(function () {
  console.log('init')
  cron.schedule('*/30 * * * *', () => onSchedule());
})();

async function onSchedule() {
  console.log('start');
  
  var twitter = new Twitter(config);
  
  var params = {screen_name: '500_headlines', count: 250, trim_user: true, exclude_replies: true};
  
  var content = await getStatusesUserTimeline(twitter, params);
  
  var headlines = readHeadlines();
  
  var tweets = content.map(tweet => tweet.text);
    
  const hoursSinceLastTweet = getHoursSinceLastTweet(headlines, content);
  
  console.log(`last tweet ${hoursSinceLastTweet} hours ago`);
  
  if (hoursSinceLastTweet > 17.25) {
    console.log(`timeline has ${content.length} tweets`);
  
    var headline = getNewHeadline(tweets, headlines);
  
    console.log(`update: ${headline}`);
    
    var status = {status: headline};
    
    var tweet = await postStatusUpdate(twitter, status);
  
    console.log(`tweet id ${tweet.id}`);
  }
  
  console.log(`done`);
}

function getStatusesUserTimeline(twitter, params) {
  return new Promise(function(resolve, reject) {
    twitter.get("statuses/user_timeline", params, function(error, media, response) {
      if (error) {
        reject(error);
      } else {
        console.log(`GET statuses/user_timeline: ${response.statusCode} ${response.statusMessage}`);
        resolve(media);
      }
    });    
  });
}

function postStatusesUpdate(twitter, status) {
  return new Promise(function(resolve, reject) {
    twitter.post("statuses/update", status, function(error, tweet, response) {
      if (error) {
        reject(error);
      } else {
        console.log(`POST statuses/update: ${response.statusCode} ${response.statusMessage}`);
        resolve(tweet);
      }
    });
  });
}

function getNewHeadline(tweets, headlines) {
  while(true) {
    var n = Math.floor(Math.random() * headlines.length);
    var headline = headlines[n];
    var headline_hashtag = `${headline} #bitcoin`;
    if (tweets.indexOf(headline) == -1 && tweets.indexOf(headline_hashtag) == -1) {
      return headline_hashtag;
    }
  }
}

function getHoursSinceLastTweet(headlines, content) {
  var i = 0;
  while(headlines.indexOf(stripHashtag(content[i].text)) == -1) {
    console.log(`Skip tweet ${content[i].text}`);
    i++;
  }
  return ((new Date() - Date.parse(content[i].created_at)) / 1000 / 60 / 60).toFixed(1);
}

function stripHashtag(tweet) {
  if (tweet.endsWith(' #bitcoin')) {
    return tweet.substring(0, tweet.length - 9);
  }
  return tweet;
}

function readHeadlines() {
  var contents = fs.readFileSync('500_headlines.txt', 'utf8');
  return contents.split('\n');
}
