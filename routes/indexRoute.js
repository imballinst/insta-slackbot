// Import modules
const app = require('../app');
const QueryUtil = require('../libs/QueryUtil');

// Index route
app.get('/', (req, res) => {
  const callback = (result) => {
    res.send(result);
  };

  QueryUtil.getMediasByTimerange(app.locals.mongoDriver.db, '20', callback);
});

app.get('/testInsert', (req, res) => {
  const callback = (result) => {
    res.send(result);
  };

  QueryUtil.getMediasByTimerange(app.locals.mongoDriver.db, '20', callback);
});
