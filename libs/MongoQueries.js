const moment = require('moment');

const destructureObj = require('./LodashUtil');

// Set locale
moment.locale('id');

/**
 * Generic CRUD Operations
 * Create, Read, Update, Delete, all transformed to generic response
 */
function insertOne(db, collection, doc) {
  return db
    .collection(collection)
    .insertOne(doc)
    .then((queryResult) => {
      const jsonResult = queryResult.toJSON();
      const { ok, rest: restProps } = destructureObj(jsonResult, ['ok']);

      return { success: ok === 1, data: restProps };
    });
}

function insertMany(db, collection, doc) {
  return db
    .collection(collection)
    .insertMany(doc)
    .then((queryResult) => {
      const jsonResult = queryResult.result;
      const { ok, rest: restProps } = destructureObj(jsonResult, ['ok']);

      return { success: ok === 1, data: restProps };
    });
}

function find(db, collection, queryParams, sortParams, limitParams) {
  const queryObject = queryParams || {};
  const sortObject = sortParams || {};
  const limit = limitParams || 0;

  return db.collection(collection).find(queryObject).sort(sortObject).limit(limit)
    .toArray()
    .then(queryResult => ({ success: true, data: queryResult }));
}

function updateOne(db, collection, queryParams, update, options) {
  return db.collection(collection).updateOne(
    queryParams,
    update,
    options
  ).then((queryResult) => {
    const jsonResult = queryResult.toJSON();
    const { ok, rest: restProps } = destructureObj(jsonResult, ['ok']);

    return { success: ok === 1, data: restProps };
  });
}

function updateMany(db, collection, queryParams, update, options) {
  return db.collection(collection).updateMany(
    queryParams,
    update,
    options
  ).then((queryResult) => {
    const jsonResult = queryResult.toJSON();
    const { ok, rest: restProps } = destructureObj(jsonResult, ['ok']);

    return { success: ok === 1, data: restProps };
  });
}

function deleteOne(db, collection, queryParams) {
  return db.collection(collection).deleteOne(queryParams).then((queryResult) => {
    const jsonResult = queryResult.toJSON();
    const { ok, rest: restProps } = destructureObj(jsonResult, ['ok']);

    return { success: ok === 1, data: restProps };
  });
}

function deleteMany(db, collection, queryParams) {
  return db.collection(collection).deleteMany(queryParams).then((queryResult) => {
    const jsonResult = queryResult.toJSON();
    const { ok, rest: restProps } = destructureObj(jsonResult, ['ok']);

    return { success: ok === 1, data: restProps };
  });
}

function findOneAndUpdate(db, collection, queryParams, update, options) {
  return db.collection(collection).findOneAndUpdate(
    queryParams,
    update,
    options
  ).then((queryResult) => {
    const { ok, rest: restProps } = destructureObj(queryResult, ['ok']);

    return { success: ok === 1, data: restProps };
  });
}

function findOneAndReplace(db, collection, queryParams, replacement, options) {
  return db.collection(collection).findOneAndReplace(
    queryParams,
    replacement,
    options
  ).then((queryResult) => {
    const { ok, rest: restProps } = destructureObj(queryResult, ['ok']);

    return { success: ok === 1, data: restProps };
  });
}

function findOneAndDelete(db, collection, queryParams, options) {
  return db.collection(collection).findOneAndDelete(
    queryParams,
    options
  ).then((queryResult) => {
    const { ok, rest: restProps } = destructureObj(queryResult, ['ok']);

    return { success: ok === 1, data: restProps };
  });
}

/**
 * Specific CRUD Operations
 * Create, Read, Update, Delete, all using the generic operations above
 */
function getMediasByTimerange(db, params) {
  const { startDate, endDate } = params;
  // TODO: edit this
  const offset = moment().utcOffset();
  const startDateMoment = moment(startDate, 'DD-MM-YYYY').add(offset, 'm').toISOString();
  const endDateMoment = moment(endDate, 'DD-MM-YYYY').add(offset, 'm').toISOString();

  const collection = 'postedmedias';
  const queryParams = {
    created_time: {
      $gte: new Date(startDateMoment),
      $lte: new Date(endDateMoment),
    },
  };

  const sortParams = [['created_time', -1]];

  return find(db, collection, queryParams, sortParams)
    .then((queryResult) => {
      const { success, data } = queryResult;
      // Pass object { success, minID, count }
      const response = { success, data: {} };

      if (data.length) {
        response.data = {
          minID: data[data.length - 1].id,
          maxID: data[0].id,
          count: data.length,
        };
      }

      return response;
    });
}

function getAdmins(db) {
  const collection = 'admins';
  const queryParams = {
    is_admin: 1,
  };

  return find(db, collection, queryParams);
}

function getAdminById(db, id) {
  const collection = 'admins';
  const queryParams = {
    is_admin: 1,
    user_id: id,
  };

  return find(db, collection, queryParams);
}

function getChannels(db) {
  const collection = 'channels';
  const queryParams = {
    is_broadcast: 1,
  };

  return find(db, collection, queryParams);
}

function getKeywords(db) {
  const collection = 'keywords';
  const queryParams = {};

  return find(db, collection, queryParams);
}

// Setters
function setAdmin(db, userID, adminStatus) {
  const collection = 'admins';

  return updateOne(
    db,
    collection,
    {
      user_id: userID,
    },
    {
      $set: {
        is_admin: adminStatus,
      },
      $setOnInsert: {
        is_admin: adminStatus,
        twitter_notify_enabled: 0,
      },
    },
    {
      upsert: true,
    }
  );
}

function setAdminNotify(db, userID, notifyStatus) {
  const collection = 'admins';

  return updateOne(
    db,
    collection,
    {
      user_id: userID,
    },
    {
      $set: {
        twitter_notify_enabled: notifyStatus,
      },
      $setOnInsert: {
        is_admin: 0,
        twitter_notify_enabled: notifyStatus,
      },
    },
    {
      upsert: true,
    }
  );
}

function setBroadcastChannel(db, channelID, channelStatus) {
  const collection = 'channels';

  return updateOne(
    db,
    collection,
    {
      channel_id: channelID,
    },
    {
      $set: {
        is_broadcast: channelStatus,
      },
    },
    {
      upsert: true,
    }
  );
}

// Add/remove operations
function addKeywords(db, keywords) {
  const collection = 'keywords';
  const keywordsArray = keywords.replace(/,(\s)+/gi, ',').split(',');
  const keywordDocuments = keywordsArray.map(keyword => ({ keyword }));

  return insertMany(db, collection, keywordDocuments);
}

function removeKeywords(db, keywords) {
  const collection = 'keywords';
  const keywordsArray = keywords.replace(/,(\s)+/gi, ',').split(',');

  return deleteMany(db, collection, { keyword: { $in: keywordsArray } });
}

module.exports = {
  insertOne,
  insertMany,
  find,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
  findOneAndUpdate,
  findOneAndReplace,
  findOneAndDelete,
  getMediasByTimerange,
  getAdmins,
  getAdminById,
  getChannels,
  getKeywords,
  setAdmin,
  setAdminNotify,
  setBroadcastChannel,
  addKeywords,
  removeKeywords,
};
