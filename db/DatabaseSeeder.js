require('dotenv').config();

const moment = require('moment');

const MongoDriver = require('../libs/MongoDriver');
const LogUtil = require('../libs/LogUtil');

const { getMedias } = require('../libs/InstagramDriver');

const isProd = process.env.NODE_ENV === 'production';

function insertMockData(db, callback) {
  const followerArray = [];
  const adminArray = [];
  let mediaArray = [];
  let followersCount = 500;

  // Function to random a number between min and max
  const getRandomNumber = (min, max) => Math.floor((Math.random() * (max - min)) + min);

  // Insert mock data for 14 days backward
  for (let i = 30; i >= 0; i -= 1) {
    const time = moment().utcOffset(7).hour(0).minute(0).second(0).subtract(i, 'days').unix();

    // Followers
    followerArray.push({ time: time.toString(), followers_count: followersCount });
    followersCount += getRandomNumber(1, 10);
  }

  getMedias(undefined, undefined, undefined, (response) => {
    const json = JSON.parse(response);
    mediaArray = json.data.map((media) => {
      const { id, created_time: createdTime } = media;

      return { id, created_time: parseInt(createdTime, 10) };
    });

    adminArray.push(
      {
        user_id: 'U1Y4059UM',
        // username: 'try.aji',
        is_admin: '1',
      },
      {
        user_id: 'U0L63DYL8',
        // username: 'abdymalikmulky',
        is_admin: '0',
      },
      {
        user_id: 'U3ZD2BT0D',
        // username: 'putrabangga',
        is_admin: '0',
      }
    );

    // Insert into postedmedias collection
    db.collection('postedmedias').insertMany(mediaArray, (err) => {
      if (err) {
        LogUtil.winston.log('error', 'Failed to mock "postedmedias" collection!');
      } else {
        LogUtil.winston.log('info', 'Successfully mocked "postedmedias" collection!');
      }

      // Insert into followers collection
      db.collection('followers').insertMany(followerArray, (err) => {
        if (err) {
          LogUtil.winston.log('error', 'Failed to mock "followers" collection!');
        } else {
          LogUtil.winston.log('info', 'Successfully mocked "followers" collection!');
        }

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

    db.collection('followers').deleteMany({}, (err, r) => {
      if (err) {
        LogUtil.winston.log('error', 'Failed to truncate "followers" collection!');
      } else {
        LogUtil.winston.log('info', 'Successfully truncated "followers" collection!');
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
