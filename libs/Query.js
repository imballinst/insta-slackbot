// Import modules
const LogUtil = require('./LogUtil');
const MongoDriver = require('mongodb').MongoClient;

// Connection URL
var url = 'mongodb://localhost:27017/instagramDB';

function query(callback) {
  MongoDriver.connect(url, (err, db) => {
    LogUtil.winston.log('info', 'Connected to MongoDB server successfully!');

    callback(db);

    db.close();
  });
}

module.exports = query;
