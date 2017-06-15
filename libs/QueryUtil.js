const moment = require('moment');

// Set locale
moment.locale('id');

// Base sort validator
function buildSortObject(sortString) {
  let sortObject = {};

  if (sortString) {
    // If it is defined
    const sortSubstring = sortString.substr(5);

    const [sortedField, sortOrder,] = sortSubstring.split('-');

    const isFieldValid =
      sortedField === 'time' ||
      sortedField === 'likes' ||
      sortedField === 'comments' ||
      sortedField === 'tags';
    const isOrderValid = sortOrder === 'asc' || sortOrder === 'desc';

    if (isFieldValid && isOrderValid) {
      sortObject = {
        [`${sortedField}`]: sortOrder === 'asc' ? 1 : -1,
      };
    }
    console.log(sortedField, sortOrder, sortObject);
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
        $gt: startDateMoment.unix().toString(),
        $lt: endDateMoment.unix().toString(),
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

function getFollowersCount(db, date, query, callback) {
  db.collection('followers').find({ date }, query).toArray((err, docs) => {
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
          } = curDoc.data;

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

function getFollowersCountSince(db, timestamp, callback) {
  const query = {};
  const buildResponseJSON = (err, docs) => {
    if (!err) {
      const { date, followersCount } = docs;
      const jsonResponse = {
        success: true,
        data: {
          date,
          followersCount,
        },
      };

      callback(jsonResponse);
    }
  };

  getFollowersCount(db, timestamp, query, buildResponseJSON);
}

module.exports = {
  getMediasByTimerange,
  getFollowersCount,
  getTotalLikesInPeriod,
  getMostLikedPosts,
  getFollowersCountSince,
};
