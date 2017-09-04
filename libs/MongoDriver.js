// Import modules
const winstonInfo = require('./LogUtil').winstonInfo;
const Promise = require('bluebird');
const MongoClient = Promise.promisifyAll(require('mongodb').MongoClient);

const { NODE_ENV, MONGO_URL, MONGO_DATABASE, MONGO_TEST_DATABASE } = process.env;

const isTestEnv = NODE_ENV === 'test';
const mongoDatabase = !isTestEnv ? MONGO_DATABASE : MONGO_TEST_DATABASE;

// Connection URL
const url = `${MONGO_URL}/${mongoDatabase}`;

const MongoDriver = {
  db: null,
  openDBConnection() {
    const that = this;
    const connectPromise = MongoClient.connect(url);

    return connectPromise.then((db) => {
      if (db) {
        winstonInfo('Connected to MongoDB server successfully!');

        that.db = db;

        return db;
      }
      throw new Error('Failed to connect to MongoDB');
    });
  },
  closeDBConnection() {
    winstonInfo('Attempting to close MongoDB connection...');

    this.db.close();
  },
};

module.exports = MongoDriver;
