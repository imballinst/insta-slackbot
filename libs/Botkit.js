// Import modules
const botkit = require('botkit');

const winstonError = require('./LogUtil').winstonError;

// Contain the bot instance and controller to be exported to the routes
const botContainer = {
  instance: undefined,
  controller: undefined,
  init() {
    const token = process.env.SLACK_BOT_TOKEN;

    if (!token) {
      winstonError('Please specify bot token!');
      process.exit(1);
    }

    this.controller = botkit.slackbot({
      debug: false,
      require_delivery: true,
    });
    this.instance = this.controller.spawn({ token });
  },
};

module.exports = botContainer;
