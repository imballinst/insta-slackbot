require('dotenv').config();

const moment = require('moment');

const MongoDriver = require('../libs/MongoDriver');
const { winstonInfo, winstonError } = require('../libs/LogUtil');

const { getMedias } = require('../libs/InstagramQueries');

const isProd = process.env.NODE_ENV === 'production';

function insertMockData(db) {
  return getMedias().then(([promiseArray1, promiseArray2]) => {
    // Get recent medias
    const medias = JSON.parse(promiseArray1);
    const mediaMaxID = JSON.parse(promiseArray2);

    const mediaArray1 = medias.data.map((media) => {
      const { id, created_time: createdTime } = media;

      return { id, created_time: new Date(moment.unix(parseInt(createdTime, 10)).toISOString()) };
    });

    return db.collection('postedmedias').insertMany(mediaArray1.concat(mediaMaxID));
  }).then((dbResponse) => {
    if (!dbResponse.result.ok) {
      throw new Error('Failed to mock "postedmedias" collection!');
    } else {
      winstonInfo('Successfully mocked "postedmedias" collection!');

      const adminArray = [{
        user_id: 'U1Y4059UM',
        // username: 'try.aji',
        is_admin: 1,
      }];

      return db.collection('admins').insertMany(adminArray);
    }
  }).then((dbResponse) => {
    if (!dbResponse.result.ok) {
      throw new Error('Failed to mock "admins" collection!');
    } else {
      winstonInfo('Successfully mocked "admins" collection!');
    }
  });
}

function clearCollection(db) {
  // Clear collection
  const clearPostedMedias = db.collection('postedmedias').deleteMany({});

  return clearPostedMedias.then((result) => {
    // After attempt to clear postedmedias
    const jsonRes = JSON.parse(result);

    if (!jsonRes.ok) {
      throw new Error('Failed to truncate "postedmedias" collection!');
    } else {
      winstonInfo('Successfully truncated "postedmedias" collection!');

      return db.collection('admins').deleteMany({});
    }
  }).then((result) => {
    // After attempt to clear admins
    const jsonRes = JSON.parse(result);

    if (!jsonRes.ok) {
      throw new Error('Failed to truncate "admins" collection!');
    } else {
      winstonInfo('Successfully truncated "admins" collection!');

      return db.collection('channels').deleteMany({});
    }
  }).then((result) => {
    // After attempt to clear channels
    const jsonRes = JSON.parse(result);

    if (!jsonRes.ok) {
      throw new Error('Failed to truncate "channels" collection!');
    } else {
      winstonInfo('Successfully truncated "channels" collection!');

      return db;
    }
  });
}

// Open database connection, if environment is not production
// Just for safety reasons
if (isProd) {
  MongoDriver.openDBConnection()
    .then(db => clearCollection(db))
    .then(db => insertMockData(db))
    .then(() => MongoDriver.closeDBConnection())
    .catch((err) => {
      // On error, log error and close DB connection
      winstonError(err);

      MongoDriver.closeDBConnection();
    });
}
