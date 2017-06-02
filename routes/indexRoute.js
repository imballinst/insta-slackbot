// Import modules
const app = require('../app');
const QueryUtil = require('../libs/QueryUtil');

// Index route
app.get('/', (req, res) => {
  const callback = (docs) => {
    res.send(docs);
  };

  const timeParams = {
    startDate: '2017-05-21',
    endDate: '2017-06-01',
  };

  // QueryUtil.getMediasByTimerange(app.locals.mongoDriver.db, timeParams, {}, callback);
  QueryUtil.getMostLikedPosts(app.locals.mongoDriver.db, timeParams, callback);
});

// app.get('/test', (req, res) => {
//   const callback = () => {
//     res.send('Inserted to db!');
//   };

//   QueryUtil.testInsertMany(app.locals.mongoDriver.db, callback);
// });
