// Import modules
const LogUtil = require('./LogUtil');
const MongoClient = require('mongodb').MongoClient;

// Connection URL
const url = 'mongodb://localhost:27017/instagram_db';

const MongoDriver = {
  db: null,
  openDBConnection(callback) {
    const that = this;

    MongoClient.connect(url, (err, db) => {
      if (err) {
        LogUtil.winston.log('error', `Error happened when connecting to database: ${err}.`);
      } else {
        LogUtil.winston.log('info', 'Connected to MongoDB server successfully!');

        that.db = db;

        if (typeof callback === 'function') {
          callback(db);
        }
      }
    });
  },
  closeDBConnection() {
    this.db.close();
  },
};

module.exports = MongoDriver;
