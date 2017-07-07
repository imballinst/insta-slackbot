const moment = require('moment');

// Set locale
moment.locale('id');

// Base getters
function getMediasByTimerange(db, params, callback) {
  const { startDate, endDate } = params;
  const startDateMoment = moment(startDate, 'DD-MM-YYYY').utcOffset(420);
  const endDateMoment = moment(endDate, 'DD-MM-YYYY').utcOffset(420);

  db.collection('postedmedias')
    .find({
      created_time: {
        $gte: startDateMoment.unix().toString(),
        $lte: endDateMoment.unix().toString(),
      },
    })
    .toArray((err, docs) => {
      // Pass object { success, minID, count }
      const dbResponse = { success: false, data: [] };

      if (!err) {
        dbResponse.success = true;

        if (docs.length) {
          dbResponse.data = {
            minID: docs[0].id,
            count: docs.length,
          };
        }
      }

      callback(dbResponse);
    });
}

function getFollowersCount(db, params, callback) {
  const { startDate, endDate } = params;
  const startDateMoment = moment(startDate, 'DD-MM-YYYY').utcOffset(420);
  const endDateMoment = moment(endDate, 'DD-MM-YYYY').utcOffset(420);

  db.collection('followers').find({
    time: {
      $gte: startDateMoment.unix().toString(),
      $lte: endDateMoment.unix().toString(),
    },
  }).toArray((err, docs) => {
    // Pass object { success, minID, count }
    const dbResponse = { success: false, data: [] };

    if (!err) {
      dbResponse.success = true;
      dbResponse.data = {
        count: docs.count,
      };
    }

    callback(dbResponse);
  });
}

function getAdmins(db, callback) {
  db.collection('admins').find({
    is_admin: '1',
  }).toArray((err, docs) => {
    // Pass object { success, docs }
    const dbResponse = { success: false, data: [] };

    if (!err) {
      dbResponse.success = true;
      dbResponse.data = docs;
    }

    callback(dbResponse);
  });
}

function getAdminById(db, id, callback) {
  db.collection('admins').find({
    user_id: id,
    is_admin: '1',
  }).toArray((err, docs) => {
    // Pass object { success, docs }
    const dbResponse = { success: false, data: [] };

    if (!err) {
      dbResponse.success = true;
      dbResponse.data = docs;
    }

    callback(dbResponse);
  });
}

function getChannels(db, callback) {
  db.collection('channels').find({
    is_broadcast: '1',
  }).toArray((err, docs) => {
    // Pass object { success, docs }
    const dbResponse = { success: false, data: [] };

    if (!err) {
      dbResponse.success = true;
      dbResponse.data = docs;
    }

    callback(dbResponse);
  });
}

// Setters
function setAdmin(db, userID, adminStatus, callback) {
  db.collection('admins').updateOne(
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
    },
    (err) => {
      const dbResponse = { success: false };

      if (!err) {
        dbResponse.success = true;
      }

      callback(dbResponse);
    }
  );
}

function setBroadcastChannel(db, channelID, channelStatus, callback) {
  db.collection('channels').updateOne(
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
    },
    (err) => {
      const dbResponse = { success: false };

      if (!err) {
        dbResponse.success = true;
      }

      callback(dbResponse);
    }
  );
}

// Insert into Mongo
function insertOneToDb(db, collection, doc, callback) {
  db.collection(collection).insertOne(doc, (err, docs) => {
    // Pass object { success, minID, count }
    const dbResponse = { success: false, data: [] };

    if (!err) {
      dbResponse.success = true;
      dbResponse.data = docs;
    }

    callback(dbResponse);
  });
}

function insertManyToDb(db, collection, doc, callback) {
  db.collection(collection).insertMany(doc, (err, docs) => {
    // Pass object { success, minID, count }
    const dbResponse = { success: false, data: [] };

    if (!err) {
      dbResponse.success = true;
      dbResponse.data = docs;
    }

    callback(dbResponse);
  });
}

module.exports = {
  getMediasByTimerange,
  getFollowersCount,
  getAdmins,
  getAdminById,
  getChannels,
  setAdmin,
  setBroadcastChannel,
  insertOneToDb,
  insertManyToDb,
};
