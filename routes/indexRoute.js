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

// app.get('/test', (req, res) => {
//   const callback = () => {
//     res.send('Inserted to db!');
//   };

//   QueryUtil.testInsert(app.locals.mongoDriver.db, callback);
// });
