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

function find(db, collection, queryParams, sortParams) {
  let docs = db.collection(collection);

  if (queryParams) { docs = docs.find(queryParams); }
  if (sortParams) { docs = docs.sort(sortParams); }

  return docs
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

  return find(db, collection, queryParams)
    .then(queryResult => ({
      success: queryResult.success,
      data: queryResult.data,
    }));
}

function getAdminById(db, id) {
  const collection = 'admins';
  const queryParams = {
    is_admin: 1,
    user_id: id,
  };

  return find(db, collection, queryParams)
    .then(queryResult => ({
      success: queryResult.success,
      data: queryResult.data,
    }));
}

function getChannels(db) {
  const collection = 'channels';
  const queryParams = {
    is_broadcast: 1,
  };

  return find(db, collection, queryParams)
    .then(queryResult => ({
      success: queryResult.success,
      data: queryResult.data,
    }));
}

// Setters
function setAdmin(db, userID, adminStatus) {
  const collection = 'admins';

  return db.collection(collection).updateOne(
    {
      user_id: userID,
    },
    {
      $set: {
        is_admin: adminStatus,
      },
    },
    {
      upsert: true,
    }
  ).then(queryResult => ({ success: JSON.parse(queryResult).ok === 1 }));
}

function setBroadcastChannel(db, channelID, channelStatus) {
  const collection = 'channels';

  return db.collection(collection).updateOne(
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
  ).then(queryResult => ({ success: JSON.parse(queryResult).ok === 1 }));
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
  setAdmin,
  setBroadcastChannel,
};
