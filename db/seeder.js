require('dotenv').config();

const moment = require('moment');

const MongoDriver = require('../libs/MongoDriver');
const { winstonInfo, winstonError } = require('../libs/LogUtil');

const { find, insertMany, deleteMany, updateOne } = require('../libs/MongoQueries');
const { getMedias } = require('../libs/InstagramQueries');

const seedingMode = process.env.SEEDING_MODE;
const slackAdminId = process.env.SLACK_ADMIN_ID;

function getRequiredFields(media) {
  const { id, created_time: createdTime } = media;
  const currentTZ = moment.unix(parseInt(createdTime, 10)).toISOString();

  return { id, created_time: new Date(currentTZ) };
}

function insertMockData(db) {
  const last20DataPromise = find(db, 'postedmedias', undefined, undefined, undefined);

  return last20DataPromise.then((dbResponse) => {
    if (!dbResponse.success) {
      throw new Error('Failed to get last 20 data in database!');
    }

    return getMedias().then(([promiseArray1, promiseArray2]) => {
      const excludeMaxIdRes = JSON.parse(promiseArray1);
      const maxIdRes = JSON.parse(promiseArray2);
      let allMedias;

      if (excludeMaxIdRes.meta.code === 200) {
        if (maxIdRes.meta.code === 200) {
          const last20Data = dbResponse.data.map(media => media.id);
          const mediaExcludeMaxId = excludeMaxIdRes.data.map(media => getRequiredFields(media));
          const maxIDMedia = !Array.isArray(maxIdRes.data) ? getRequiredFields(maxIdRes.data) : [];

          allMedias = mediaExcludeMaxId.concat(maxIDMedia);
          allMedias = allMedias.filter(media => !last20Data.includes(media.id));
        } else {
          throw new Error(maxIdRes.meta.error_message);
        }
      } else {
        throw new Error(excludeMaxIdRes.meta.error_message);
      }

      // Insert medias-- or mock if allMedias length is 0
      if (allMedias.length) {
        return insertMany(db, 'postedmedias', allMedias);
      }

      return new Promise(resolve => resolve({
        success: true,
        data: { n: 0 },
      }));
    }).then((insertMediaResponse) => {
      if (!insertMediaResponse.success) {
        throw new Error('Failed to mock "postedmedias" collection!');
      }

      winstonInfo(`Successfully mocked "postedmedias" collection: ${insertMediaResponse.data.n}!`);

      // Update admin or insert if not exists
      return updateOne(
        db,
        'admins',
        { user_id: slackAdminId },
        {
          $set: {
            is_admin: 1,
            twitter_notify_enabled: 0,
          },
        },
        { upsert: true }
      );
    }).then((updateAdminResponse) => {
      if (!updateAdminResponse.success) {
        throw new Error('Failed to mock "admins" collection!');
      }

      winstonInfo('Successfully mocked "admins" collection!');
    });
  });
}

function clearCollection(db) {
  // If truncate then delete; else resolve db automatically
  if (seedingMode === 'truncate') {
    const clearPostedMedias = deleteMany(db, 'postedmedias', {});

    return clearPostedMedias.then((dbResponse) => {
      if (!dbResponse.success) {
        throw new Error('Failed to truncate "postedmedias" collection!');
      } else {
        winstonInfo('Successfully truncated "postedmedias" collection!');

        return db;
      }
    });
  }
  return new Promise(resolve => resolve(db));
}

// Execute
MongoDriver.openDBConnection()
  .then(db => clearCollection(db))
  .then(db => insertMockData(db))
  .then(() => MongoDriver.closeDBConnection())
  .catch((err) => {
    // On error, log error and close DB connection
    winstonError(err);

    MongoDriver.closeDBConnection();
  });
