const moment = require('moment');

// Set locale
moment.locale('id');

// Base sort validator
function buildSortObject(sortString) {
  const sortObject = {};

  // If defined only
  if (sortString) {
    const [sortedField, sortOrder] = sortString.split(':');

    // Valid fields and orders
    const isFieldValid =
      sortedField === 'time' ||
      sortedField === 'likes' ||
      sortedField === 'comments' ||
      sortedField === 'tags';
    const isOrderValid = sortOrder === 'asc' || sortOrder === 'desc';

    // Check if the inputs are valid
    if (isFieldValid && isOrderValid) {
      // Mongo sorting asc is 1 and desc is -1
      sortObject[`${sortedField}`] = sortOrder === 'asc' ? 1 : -1;
    }
  }

  return sortObject;
}

// Base getters
function getMediasByTimerange(db, params, query, callback) {
  const { startDate, endDate, sort } = params;
  const startDateMoment = moment(startDate, 'DD-MM-YYYY');
  const endDateMoment = moment(endDate, 'DD-MM-YYYY');
  const sortObject = buildSortObject(sort);

  db.collection('postedmedias')
    .find({
      created_time: {
        $gte: startDateMoment.unix().toString(),
        $lte: endDateMoment.unix().toString(),
      },
    }, query)
    .sort(sortObject)
    .toArray((err, docs) => {
      // Pass parameters to callback function
      callback(err, docs, {
        startDateMoment,
        endDateMoment,
      });
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
    // Pass parameters to callback function
    callback(err, docs);
  });
}

// Modified getters
function getMostLikedPosts(db, params, callback) {
  const query = {
    likes: 1,
    created_time: 1,
    'caption.text': 1,
    link: 1,
  };
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

  getMediasByTimerange(db, params, query, buildResponseJSON);
}

function getTotalLikesInPeriod(db, params, callback) {
  const query = { likes: 1 };
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

  getMediasByTimerange(db, params, query, buildResponseJSON);
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
