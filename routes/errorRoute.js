// Import modules
const winstonError = require('../libs/LogUtil').winstonError;

function initErrorRoute(app) {
  // 404 Resource Not Found
  app.get('*', (req, res) => {
    res.send('Not found!');
  });

  // 500 Internal Server Error
  app.use((err, req, res, next) => {
    winstonError(err.stack);

    res.status(500).send('Something broke!');
    next();
  });
}

module.exports = initErrorRoute;
