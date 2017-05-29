// Import modules
const botkit = require('botkit');

const LogUtil = require('./LogUtil');

// Get token from environment process
const token = process.env.SLACK_BOT_TOKEN;

if (!token) {
  LogUtil.winston.log('error', 'Please specify bot token!');
  process.exit(1);
}

const controller = botkit.slackbot({ debug: false });
const instance = controller.spawn({ token });

// Contain the bot instance and controller to be exported to the routes
const botContainer = {
  instance,
  controller,
};

module.exports = botContainer;
