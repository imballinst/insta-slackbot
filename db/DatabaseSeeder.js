require('dotenv').config();

const moment = require('moment');

const MongoDriver = require('../libs/MongoDriver');
const LogUtil = require('../libs/LogUtil');

const isProd = process.env.NODE_ENV === 'production';

function insertMockData(db, callback) {
  const array = [];

  // Function to random a number between min and max
  const getRandomNumber = (min, max) => Math.floor((Math.random() * (max - min)) + min);

  // Insert mock data for 14 days backward
  for (let i = 0; i < 30; i += 1) {
    const time = moment().subtract(i, 'days').unix();

    array.push({
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
        count: getRandomNumber(12, 15),
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
    });
  }

  // Insert pushed arrays into postedmedias collection
  db.collection('postedmedias').insertMany(array, (err, r) => {
    if (err) {
      LogUtil.winston.log('error', 'Failed to mock "postedmedias" collection!');
    } else {
      LogUtil.winston.log('info', 'Successfully mocked "postedmedias" collection!');
    }

    if (typeof callback === 'function') {
      callback(db);
    }
  });
}

function clearCollection(db, callback) {
  // Clear collection
  db.collection('postedmedias').deleteMany({}, (err, r) => {
    if (err) {
      LogUtil.winston.log('error', 'Failed to truncate "postedmedias" collection!');
    } else {
      LogUtil.winston.log('info', 'Successfully truncated "postedmedias" collection!');
    }

    if (typeof callback === 'function') {
      callback(db);
    }
  });
}

// Set callback function after database connection is established
function openConnectionCallback (db) {
  // Start database seeding process
  const clearCollectionCallback = (db) => {
    insertMockData(db, MongoDriver.closeDBConnection);
  };

  clearCollection(db, clearCollectionCallback);
};

// Open database connection, if environment is not production
// Just for safety reasons
if (isProd) {
  MongoDriver.openDBConnection(openConnectionCallback);
}
