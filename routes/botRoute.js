// Import modules
// const querystring = require('querystring');

const LogUtil = require('../libs/LogUtil');

const app = require('../app');
// const httpsRequest = require('../libs/HttpsRequest');

// Bot module
const botLibs = require('../libs/Botkit');

const botInstance = botLibs.instance;
const botController = botLibs.controller;

const slackChannelID = process.env.SLACK_CHANNEL;

// Start the real-time messaging
botInstance.startRTM((err) => {
  if (err) {
    throw new Error(err);
  }
});

// On route hit
app.post('/callback-sub', (req, res) => {
  // JSON Object of POST data
  LogUtil.winston.log('info', 'Got POST request from Instagram Subscriptions: ', req.body);

  res.send();

  botInstance.say({
    text: 'Dapet subscribe nih',
    channel: slackChannelID,
  });
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
