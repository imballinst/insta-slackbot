// Import modules
const app = require('../app');

const LogUtil = require('../libs/LogUtil');

// 404 Resource Not Found
app.get('*', (req, res) => {
  res.send('Not found!');
});

// 500 Internal Server Error
app.use((err, req, res, next) => {
  LogUtil.winston.log('error', err.stack);

  res.status(500).send('Something broke!');
  next();
});
