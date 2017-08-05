require('dotenv').config();

const moment = require('moment');

const MongoDriver = require('../libs/MongoDriver');
const LogUtil = require('../libs/LogUtil');

const { getMedias } = require('../libs/InstagramDriver');

const isProd = process.env.NODE_ENV === 'production';

function insertMockData(db, callback) {
  getMedias(undefined, undefined, undefined, (response) => {
    const json = JSON.parse(response);
    const mediaArray = json.data.map((media) => {
      const { id, created_time: createdTime } = media;

      return { id, created_time: new Date(moment.unix(parseInt(createdTime, 10)).toISOString()) };
    });

    // Insert into postedmedias collection
    db.collection('postedmedias').insertMany(mediaArray, (err) => {
      if (err) {
        LogUtil.winston.log('error', 'Failed to mock "postedmedias" collection!');
      } else {
        LogUtil.winston.log('info', 'Successfully mocked "postedmedias" collection!');
      }

      const adminArray = [{
        user_id: 'U1Y4059UM',
        // username: 'try.aji',
        is_admin: '1',
      }];

      // Insert into admins collection
      db.collection('admins').insertMany(adminArray, (err) => {
        if (err) {
          LogUtil.winston.log('error', 'Failed to mock "admins" collection!');
        } else {
          LogUtil.winston.log('info', 'Successfully mocked "admins" collection!');
        }

        // Callback function
        if (typeof callback === 'function') {
          callback(db);
        }
      });
    });
  });
}

function clearCollection(db, callback) {
  // Clear collection
  db.collection('postedmedias').deleteMany({}, (err, r) => {
    if (err) {
      LogUtil.winston.log('error', 'Failed to truncate "postedmedias" collection!');
    } else {
      LogUtil.winston.log('info', 'Successfully truncated "postedmedias" collection!');
    }

    db.collection('admins').deleteMany({}, (err, r) => {
      if (err) {
        LogUtil.winston.log('error', 'Failed to truncate "admins" collection!');
      } else {
        LogUtil.winston.log('info', 'Successfully truncated "admins" collection!');
      }

      db.collection('channels').deleteMany({}, (err, r) => {
        if (err) {
          LogUtil.winston.log('error', 'Failed to truncate "channels" collection!');
        } else {
          LogUtil.winston.log('info', 'Successfully truncated "channels" collection!');
        }

        if (typeof callback === 'function') {
          callback(db);
        }
      });
    });
  });
}

// Set callback function after database connection is established
function openConnectionCallback (db) {
  // Start database seeding process
  const clearCollectionCallback = (db) => {
    insertMockData(db, MongoDriver.closeDBConnection);
  };

  clearCollection(db, clearCollectionCallback);
};

// Open database connection, if environment is not production
// Just for safety reasons
if (isProd) {
  MongoDriver.openDBConnection(openConnectionCallback);
}
