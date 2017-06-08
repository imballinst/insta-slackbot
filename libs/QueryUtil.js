const moment = require('moment');

// Set locale
moment.locale('id');

function getMediasByTimerange(db, timeParams, query, callback) {
  const { startDate, endDate } = timeParams;
  const startDateMoment = moment(startDate, 'DD-MM-YYYY');
  const endDateMoment = moment(endDate, 'DD-MM-YYYY');

  db.collection('postedmedias').find({
    'data.created_time': {
      $gt: startDateMoment.unix().toString(),
      $lt: endDateMoment.unix().toString(),
    },
  }, query).toArray((err, docs) => {
    // Pass parameters to callback function
    callback(err, docs, {
      startDateMoment,
      endDateMoment,
    });
  });
}

function getMostLikedPosts(db, timeParams, callback) {
  const query = {
    'data.likes': 1,
    'data.created_time': 1,
    'data.caption.text': 1,
    'data.link': 1,
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
          return Math.max(maxLikes, curDoc.data.likes.count);
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

  getMediasByTimerange(db, timeParams, query, buildResponseJSON);
}

function getTotalLikesInPeriod(db, timeParams, callback) {
  const query = { 'data.likes': 1 };
  const buildResponseJSON = (err, docs, momentProps) => {
    if (!err) {
      const { startDateMoment, endDateMoment } = momentProps;
      const jsonResponse = {
        success: true,
        data: {
          startDate: startDateMoment.format('dddd, Do MMMM YYYY'),
          endDate: endDateMoment.format('dddd, Do MMMM YYYY'),
          totalLikes: docs.reduce((sum, val) => sum + val.data.likes.count, 0),
        },
      };

      callback(jsonResponse);
    }
  };

  getMediasByTimerange(db, timeParams, query, buildResponseJSON);
}

module.exports = {
  getMediasByTimerange,
  getTotalLikesInPeriod,
  getMostLikedPosts,
};
