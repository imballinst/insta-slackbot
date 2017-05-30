// Import modules
const LogUtil = require('./LogUtil');
const MongoClient = require('mongodb').MongoClient;

// Connection URL
const url = 'mongodb://localhost:27017/instagramDB';

const MongoDriver = {
  db: null,
  openDBConnection() {
    MongoClient.connect(url, (err, db) => {
      LogUtil.winston.log('info', 'Connected to MongoDB server successfully!');

      this.db = db;
    });
  },
  closeDBConnection() {
    this.db.close();
  },
};

module.exports = MongoDriver;
