// Import modules
const app = require('../app');
const QueryUtil = require('../libs/QueryUtil');

// Index route
app.get('/', (req, res) => {
  const callback = (result) => {
    res.send(result);
  };

  const timeParams = {
    startDate: '2017-05-30',
    endDate: '2017-06-01',
  };

  QueryUtil.getMostLikedPosts(app.locals.mongoDriver.db, timeParams, callback);
});

// app.get('/test', (req, res) => {
//   const callback = () => {
//     res.send('Inserted to db!');
//   };

//   QueryUtil.testInsertMany(app.locals.mongoDriver.db, callback);
// });
