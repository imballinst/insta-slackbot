require('dotenv').config();

const moment = require('moment');

const MongoDriver = require('../libs/MongoDriver');
const LogUtil = require('../libs/LogUtil');

const { getMedias } = require('../libs/InstagramDriver');

const isProd = process.env.NODE_ENV === 'production';

function insertMockData(db, callback) {
  const mediaArray = [];
  const followerArray = [];
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

  mediaArray.push(
    {
      "id":"1525240244365906456_1945373804",
      "created_time":"1496042827",
    },
    {
      "id":"1516059927444791289_1945373804",
      "created_time":"1494948448",
    },
    {
      "id":"1007765561032799472_1945373804",
      "created_time":"1434355038",
    },
    {
      "id":"1007748652140820479_1945373804",
      "created_time":"1434353022",
    },
    {
      "id":"1007719002664564269_1945373804",
      "created_time":"1434349488",
    }
  );

  // Insert pushed mediaArrays into postedmedias collection
  db.collection('postedmedias').insertMany(mediaArray, (err) => {
    if (err) {
      LogUtil.winston.log('error', 'Failed to mock "postedmedias" collection!');
    } else {
      LogUtil.winston.log('info', 'Successfully mocked "postedmedias" collection!');
    }

    db.collection('followers').insertMany(followerArray, (err) => {
      if (err) {
        LogUtil.winston.log('error', 'Failed to mock "followers" collection!');
      } else {
        LogUtil.winston.log('info', 'Successfully mocked "followers" collection!');
      }

      if (typeof callback === 'function') {
        callback(db);
      }
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
        LogUtil.winston.log('error', 'Failed to truncate "postedmedias" collection!');
      } else {
        LogUtil.winston.log('info', 'Successfully truncated "postedmedias" collection!');
      }

      if (typeof callback === 'function') {
        callback(db);
      }
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
