// Import modules
const BotLibs = require('../libs/Botkit');
const initAdminFeatures = require('./botrunners/Admin');
const initInstagramFeatures = require('./botrunners/Instagram');
const initTwitterFeatures = require('./botrunners/Twitter');

const { winstonInfo, winstonError } = require('../libs/LogUtil');

function initBotRoute(app) {
  // Init BotLibs
  BotLibs.init();

  const { instance: botInstance, controller: botController } = BotLibs;

  const startRTM = () => {
    botInstance.startRTM((err) => {
      if (err) {
        winstonError(err);
      }
    });
  };

  startRTM();

  botController.on('rtm_close', () => {
    winstonInfo('RTM closed. Restarting RTM now!');

    startRTM();
  });

  initAdminFeatures(app, botController);
  initInstagramFeatures(app, botInstance, botController);
  initTwitterFeatures(app, botInstance, botController);
}

module.exports = initBotRoute;
