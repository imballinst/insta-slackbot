// Routes
const initSubRoute = require('../routes/subscribeRoute');
const initAccessTokenRoute = require('../routes/accessTokenRoute');
const initInstaApiRoute = require('../routes/instaApiRoute');
const initSlackApiRoute = require('../routes/slackApiRoute');
const initBotRoute = require('../routes/botRoute');
const initErrorRoute = require('../routes/errorRoute');

function initAllRoutes(app) {
  // Index route
  app.get('/', (req, res) => {
    res.send('Hello world!');
  });

  initSubRoute(app);
  initAccessTokenRoute(app);
  initInstaApiRoute(app);
  initSlackApiRoute(app);
  initBotRoute(app);
  initErrorRoute(app);
}

module.exports = initAllRoutes;
