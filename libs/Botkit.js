// Import modules
const botkit = require('botkit');

const LogUtil = require('./LogUtil');

// Contain the bot instance and controller to be exported to the routes
const botContainer = {
  instance: undefined,
  controller: undefined,
  init: () => {
    // Get node environment
    const isProd = process.env.NODE_ENV === 'production';

    if (!isProd) {
      const token = process.env.SLACK_BOT_TOKEN;

      if (!token) {
        LogUtil.winston.log('error', 'Please specify bot token!');
        process.exit(1);
      }

      this.controller = botkit.slackbot({
        debug: false,
        require_delivery: true,
      });
      this.instance = this.controller.spawn({ token });
    }
  },
};

module.exports = botContainer;
