const moment = require('moment');

// Set locale
moment.locale('id');

// Base getters
function getMediasByTimerange(db, params, callback) {
  const { startDate, endDate, sort } = params;
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

function getMostLikedPosts(db, params, callback) {
  const buildResponseJSON = (err, docs, momentProps) => {
    if (!err) {
      const { startDateMoment, endDateMoment } = momentProps;
      const getPosts = () => {
        let array = [];

        docs.reduce((maxLikes, curDoc) => {
          // If likes of current post is higher, push to array
          const {
            link,
            created_time: createdAt,
            likes,
            caption,
          } = curDoc;

          if (likes.count >= maxLikes) {
            if (likes.count > maxLikes) {
              array = [];
            }

            array.push({
              link,
              date: moment.unix(createdAt).format('dddd, Do MMMM YYYY'),
              likes: likes.count,
              text: caption.text,
            });
          }

          // Return the maximum number of likes
          return Math.max(maxLikes, curDoc.likes.count);
        }, -Infinity);

        return array;
      };

      const jsonResponse = {
        success: true,
        data: {
          posts: getPosts(),
          startDate: startDateMoment.format('dddd, Do MMMM YYYY'),
          endDate: endDateMoment.format('dddd, Do MMMM YYYY'),
        },
      };

      callback(jsonResponse);
    }
  };

  getMediasByTimerange(db, params, buildResponseJSON);
}

function getTotalLikesInPeriod(db, params, callback) {
  const buildResponseJSON = (err, docs, momentProps) => {
    if (!err) {
      const { startDateMoment, endDateMoment } = momentProps;
      const jsonResponse = {
        success: true,
        data: {
          startDate: startDateMoment.format('dddd, Do MMMM YYYY'),
          endDate: endDateMoment.format('dddd, Do MMMM YYYY'),
          totalLikes: docs.reduce((sum, val) => sum + val.likes.count, 0),
        },
      };

      callback(jsonResponse);
    }
  };

  getMediasByTimerange(db, params, buildResponseJSON);
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

module.exports = {
  getMediasByTimerange,
  getFollowersCount,
  getTotalLikesInPeriod,
  getMostLikedPosts,
  getFollowersCountSince,
};
