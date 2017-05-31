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

module.exports = {
  getMediasByTimerange,
  testInsert,
};
