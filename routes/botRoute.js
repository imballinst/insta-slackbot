// Import modules
const LogUtil = require('../libs/LogUtil');
const botLibs = require('../libs/Botkit');
const InstagramDriver = require('../libs/InstagramDriver');

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

// On receive events
botController.hears(['hello', 'hi'], [dMessage, dMention, mention], (bot, message) => {
  LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

  bot.reply(message, 'Hello.');
});

botController.hears(['yuk'], [dMessage, dMention], (bot, message) => {
  LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);
});
