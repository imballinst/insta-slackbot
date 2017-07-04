// Import modules
const LogUtil = require('./LogUtil');
const MongoClient = require('mongodb').MongoClient;

const mongoURL = process.env.MONGO_URL;
const mongoDatabase = process.env.MONGO_DATABASE;

// Connection URL
const url = `${mongoURL}/${mongoDatabase}`;

const MongoDriver = {
  db: null,
  openDBConnection(callback) {
    const that = this;
    that.closeDBConnection = that.closeDBConnection.bind(that);

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
