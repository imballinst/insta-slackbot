const moment = require('moment');

function getMediasByTimerange(db, daysBackward, callback) {
  const timeAnchor = moment().subtract(daysBackward, 'days').unix();

  db.collection('postedmedias').find({
    'data.created_time': {
      $gt: timeAnchor.toString(),
    },
  }).toArray((err, docs) => {
    callback(docs);
  });
}

function getTotalLikesInPeriod(db, timeParams, callback) {
  const { startDate, endDate } = timeParams;
  const startDateMoment = moment(startDate);
  const endDateMoment = moment(endDate);

  db.collection('postedmedias').find({
    'data.created_time': {
      $gt: startDateMoment.unix().toString(),
      $lt: endDateMoment.unix().toString(),
    },
  }, {
    'data.likes': 1,
  }).toArray((err, docs) => {
    const jsonResponse = {
      success: true,
      data: {
        startDate: startDateMoment.format('dddd, MMMM Do YYYY'),
        endDate: endDateMoment.format('dddd, MMMM Do YYYY'),
        totalLikes: docs.reduce((sum, val) => sum + val.data.likes.count, 0),
      },
    };
    callback(jsonResponse);
  });
}

function testInsert(db, callback) {
  const json = {
    data: {
      id: '1516059927444791289_1945373804',
      user: {
        id: '1945373804',
        full_name: 'Try Ajitiono',
        profile_picture: 'https://scontent.cdninstagram.com/t51.2885-19/s150x150/18646657_706496922868789_3662671655315963904_a.jpg',
        username: 'imballinst',
      },
      images: {
        thumbnail: {
          width: 150,
          height: 150,
          url: 'https://scontent.cdninstagram.com/t51.2885-15/s150x150/e35/18443697_456877937995004_1901948450816131072_n.jpg',
        },
        low_resolution: {
          width: 320,
          height: 320,
          url: 'https://scontent.cdninstagram.com/t51.2885-15/s320x320/e35/18443697_456877937995004_1901948450816131072_n.jpg',
        },
        standard_resolution: {
          width: 480,
          height: 480,
          url: 'https://scontent.cdninstagram.com/t51.2885-15/e35/18443697_456877937995004_1901948450816131072_n.jpg',
        },
      },
      created_time: '1494948448',
      caption: {
        id: '17855760718189585',
        text: 'Got so bored of playing games, decided to do silly things instead.\n\n#instagramAPI #testapi #sorryforspam',
        created_time: '1494948448',
        from: {
          id: '1945373804',
          full_name: 'Try Ajitiono',
          profile_picture: 'https://scontent.cdninstagram.com/t51.2885-19/s150x150/18646657_706496922868789_3662671655315963904_a.jpg',
          username: 'imballinst',
        },
      },
      user_has_liked: false,
      likes: {
        count: 2,
      },
      tags: [
        'testapi',
        'sorryforspam',
        'instagramapi',
      ],
      filter: 'Normal',
      comments: {
        count: 8,
      },
      type: 'image',
      link: 'https://www.instagram.com/p/BUKIHi5jR_5/',
      location: null,
      attribution: null,
      users_in_photo: [

      ],
    },
    meta: {
      code: 200,
    },
  };

  const result = db.collection('postedmedias').insertOne(json);

  callback(result);
}

function testInsertMany(db, callback) {
  const getRandomNumber = (min, max) => Math.floor((Math.random() * max) + min);

  // Test insert for 14 days backward
  const insertTwoWeeksBackward = () => {
    const array = [];

    for (let i = 0; i < 14; i += 1) {
      const time = moment().subtract(i, 'days').unix();

      array.push({
        data: {
          id: '1516059927444791289_1945373804',
          user: {
            id: '1945373804',
            full_name: 'Try Ajitiono',
            profile_picture: 'https://scontent.cdninstagram.com/t51.2885-19/s150x150/18646657_706496922868789_3662671655315963904_a.jpg',
            username: 'imballinst',
          },
          images: {
            thumbnail: {
              width: 150,
              height: 150,
              url: 'https://scontent.cdninstagram.com/t51.2885-15/s150x150/e35/18443697_456877937995004_1901948450816131072_n.jpg',
            },
            low_resolution: {
              width: 320,
              height: 320,
              url: 'https://scontent.cdninstagram.com/t51.2885-15/s320x320/e35/18443697_456877937995004_1901948450816131072_n.jpg',
            },
            standard_resolution: {
              width: 480,
              height: 480,
              url: 'https://scontent.cdninstagram.com/t51.2885-15/e35/18443697_456877937995004_1901948450816131072_n.jpg',
            },
          },
          created_time: time.toString(),
          caption: {
            id: '17855760718189585',
            text: 'Got so bored of playing games, decided to do silly things instead.\n\n#instagramAPI #testapi #sorryforspam',
            created_time: time.toString(),
            from: {
              id: '1945373804',
              full_name: 'Try Ajitiono',
              profile_picture: 'https://scontent.cdninstagram.com/t51.2885-19/s150x150/18646657_706496922868789_3662671655315963904_a.jpg',
              username: 'imballinst',
            },
          },
          user_has_liked: false,
          likes: {
            count: getRandomNumber(1, 15),
          },
          tags: [
            'testapi',
            'sorryforspam',
            'instagramapi',
          ],
          filter: 'Normal',
          comments: {
            count: getRandomNumber(1, 15),
          },
          type: 'image',
          link: 'https://www.instagram.com/p/BUKIHi5jR_5/',
          location: null,
          attribution: null,
          users_in_photo: [

          ],
        },
        meta: {
          code: 200,
        },
      });
    }

    db.collection('postedmedias').insertMany(array);
  };

  insertTwoWeeksBackward();

  callback();
}

module.exports = {
  getMediasByTimerange,
  getTotalLikesInPeriod,
  testInsert,
  testInsertMany,
};
