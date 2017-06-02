// Import modules
const LogUtil = require('../libs/LogUtil');
const botLibs = require('../libs/Botkit');
const InstagramDriver = require('../libs/InstagramDriver');
const QueryUtil = require('../libs/QueryUtil');

const app = require('../app');

// Bot things
const botInstance = botLibs.instance;
const botController = botLibs.controller;

const slackChannelID = process.env.SLACK_CHANNEL;

// Destructure functions
const getMediaById = InstagramDriver.getMediaById;

// Start the real-time messaging
botInstance.startRTM((err) => {
  if (err) {
    throw new Error(err);
  }
});

// On route hit
app.post('/callback-sub', (req, res) => {
  // JSON Object of POST data
  const mediaID = req.body['0'].data.media_id;
  LogUtil.winston.log('info', 'Got POST request from Instagram Subscriptions: ', req.body);

  const callback = (json) => {
    app.locals.mongoDriver.db.collection('postedmedias').insertOne(json);
    res.send();

    botInstance.say({
      text: 'Dapet subscribe nih',
      channel: slackChannelID,
    });
  };

  getMediaById(mediaID, callback);
});

// List events
const dMessage = 'direct_message';
const dMention = 'direct_mention';
const mention = 'mention';
const ambient = 'ambient';

// On receive events
botController.hears(['hello', 'hi'], [dMessage, dMention, mention], (bot, message) => {
  LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

  bot.reply(message, 'Hello.');
});

// Get total likes of posts in a timerange
botController.hears(['!count'], [ambient], (bot, message) => {
  LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

  const callback = (json) => {
    if (json.success) {
      const {
        startDate: start,
        endDate: end,
        totalLikes,
      } = json.data;

      bot.say({
        channel: slackChannelID,
        text: `Total post likes count dari ${start} hingga ${end} ada ${totalLikes}.`,
      });
    }
  };

  const [, startDate, endDate] = message.text.split(' ');

  const timeParams = { startDate, endDate };

  QueryUtil.getTotalLikesInPeriod(app.locals.mongoDriver.db, timeParams, callback);
});

// Get post(s) with the most likes in a timerange
botController.hears(['!mostlikes'], [ambient], (bot, message) => {
  LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

  const callback = (json) => {
    if (json.success) {
      const {
        startDate: start,
        endDate: end,
        posts,
      } = json.data;

      const length = posts.length;
      let botMsg = '';

      if (length) {
        posts.forEach((post, i) => {
          const { link, date, likes, text } = post;
          // Manually concat for each post
          botMsg += `${i + 1}. ${link} (${date}) - ${likes} likes\n` +
                  `${text}`;

          // Add newline if it is not the last element
          botMsg += (i + 1 < length) ? '\n' : '';
        });
      } else {
        botMsg = `Tidak ada post dari ${start} hingga ${end}`;
      }

      bot.say({
        channel: slackChannelID,
        text: botMsg,
      });
    }
  };

  const [, startDate, endDate] = message.text.split(' ');

  const timeParams = { startDate, endDate };

  QueryUtil.getTotalLikesInPeriod(app.locals.mongoDriver.db, timeParams, callback);
});
