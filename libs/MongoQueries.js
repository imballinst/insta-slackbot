const moment = require('moment');

// Set locale
moment.locale('id');

// Base getters
function getMediasByTimerange(db, params, callback) {
  const { startDate, endDate } = params;
  const startDateMoment = moment(startDate, 'DD-MM-YYYY');
  const endDateMoment = moment(endDate, 'DD-MM-YYYY');

  db.collection('postedmedias')
    .find({
      created_time: {
        $gte: startDateMoment.unix().toString(),
        $lte: endDateMoment.unix().toString(),
      },
    })
    .toArray((err, docs) => {
      // Pass object { success, minID, count }
      const dbResponse = { success: false, data: {} };

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
  const startDateMoment = moment(startDate, 'DD-MM-YYYY');
  const endDateMoment = moment(endDate, 'DD-MM-YYYY');

  db.collection('followers').find({
    time: {
      $gte: startDateMoment.unix().toString(),
      $lte: endDateMoment.unix().toString(),
    },
  }).toArray((err, docs) => {
    // Pass object { success, minID, count }
    const dbResponse = { success: false, data: {} };

    if (!err) {
      dbResponse.success = true;
      dbResponse.data = {
        count: docs.count,
      };
    }

    callback(dbResponse);
  });
}

function getFollowersCountSince(db, params, callback) {
  const buildResponseJSON = (err, data) => {
    if (!err) {
      const jsonResponse = {
        success: true,
        data,
      };

      callback(jsonResponse);
    }
  };

  getFollowersCount(db, params, buildResponseJSON);
}

// Insert into Mongo
function insertToDb(db, collection, document, callback) {
  db.collection(collection).insertMany(document, callback);
}

module.exports = {
  getMediasByTimerange,
  getFollowersCount,
  getFollowersCountSince,
  insertToDb,
};
