// const moment = require('moment');

// Import modules
const LogUtil = require('../libs/LogUtil');
const BotLibs = require('../libs/Botkit');
const InstagramDriver = require('../libs/InstagramDriver');
// const QueryUtil = require('../libs/QueryUtil');

const app = require('../app');

// Get node environment
const slackChannelID = process.env.SLACK_CHANNEL;
const isProd = process.env.NODE_ENV === 'production';

// Destructure functions
const getMediaById = InstagramDriver.getMediaById;

if (isProd) {
  // If app is running in production mode
  LogUtil.winston.log('info', 'Production environment detected. Starting Slackbot.');

  // Initialize the bot
  BotLibs.init();

  const botInstance = BotLibs.instance;
  const botController = BotLibs.controller;

  // Start RTM function
  const startRTM = () => {
    botInstance.startRTM((err) => {
      if (err) {
        LogUtil.winston.log('error', err);
      }
    });
  };

  // Start the real-time messaging
  startRTM();

  // Start the real-time messaging if it is closed
  botController.on('rtm_close', () => {
    LogUtil.winston.log('info', 'RTM closed. Restarting RTM now!');

    startRTM();
  });

  // On route hit
  app.post('/callback-sub', (req, res) => {
    LogUtil.winston.log('info', 'Got POST request from Instagram Subscriptions: ', req.body);

    // JSON Object of POST data
    const mediaID = req.body['0'].data.media_id;

    const callback = (json) => {
      const jsonObject = JSON.parse(json);
      const { data, meta } = jsonObject;

      if (meta.code === 200) {
        // If media exists
        app.locals.mongoDriver.db.collection('postedmedias').insertOne(data);
        res.send();

        botInstance.say({
          text: `Ada post baru nih di Instagram! ${data.link}\n\n"${data.caption.text}"`,
          channel: slackChannelID,
        });
      } else {
        // If media doesn't exist
        LogUtil.winston.log('error', 'Media not found!');
      }
    };

    getMediaById(mediaID, callback);
  });

  // List events
  const ambient = 'ambient';

  // On receive events
  // Help
  botController.hears(['!help'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const textArrays = [
      'Ada dua tipe perintah, yaitu perintah administratif dan perintah query Instagram.',
      '\t*1. Perintah administratif*',
      '\t\t• `!admins`: Menampilkan daftar admin yang berhak memberikan perintah',
      '\t\t• `!promote`: Memberikan akses admin kepada seorang user',
      '\t\t• `!demote`: Mencabut akses admin dari seorang user',
      '\t\t• `!channels`: Menampilkan daftar channel tempat output dari post-post Instagram',
      '\t\t• `!setchannel`: Menentukan channel tempat output dari post-post Instagram',
      '\t\t• `!help`: Memberikan daftar perintah-perintah yang dapat diinput oleh admin',
      '\t*2. Perintah query Instagram*',
      '\t\t• `!review`: Melakukan rekapitulasi post-post dari kurun waktu tertentu',
      '\t\t• `!mostlikes`: Mencari post-post dengan jumlah likes terbanyak dari kurun waktu tertentu',
      '\t\t• `!count`: Menghitung jumlah post dari kurun waktu tertentu',
      '\t\t• `!followers`: Melakukan rekapitulasi jumlah followers per harinya dari kurun waktu tertentu',
      'Untuk mengetahui detil perintah, ketik perintah tersebut diikuti dengan *--help*. Contoh: `!promote --help`',
    ];
    const text = textArrays.join('\n');

    bot.reply(message, text);
  });

  // Week review
  // botController.hears(['!review'], [ambient], (bot, message) => {
  //   LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

  //   const params = setParamsFromMessage(message);

  //   if (isDateValid(params.startDate) && isDateValid(params.endDate)) {
  //     // If the dates are valid or if review is not defined; it is current week
  //     const callback = (err, posts, momentProps) => {
  //       if (!err) {
  //         const {
  //           startDateMoment: start,
  //           endDateMoment: end,
  //         } = momentProps;
  //         const length = posts.length;
  //         let botMsg = '';

  //         if (length) {
  //           botMsg = `Review dari ${formatDatetime(start)} hingga ${formatDatetime(end)}:\n`;

  //           posts.forEach((post, i) => {
  //             const {
  //               link,
  //               created_time: date,
  //               likes,
  //               caption,
  //             } = post;
  //             const createdAt = formatDatetime(moment.unix(date));

  //             // Manually concat for each post
  //             botMsg += `${i + 1}. ${link} (${createdAt}) - ${likes.count} likes\n` +
  //                     `${caption.text}`;

  //             // Add newline if it is not the last element
  //             botMsg += (i + 1 < length) ? '\n' : '';
  //           });
  //         } else {
  //           botMsg = `Tidak ada post dari ${formatDatetime(start)} hingga ${formatDatetime(end)}`;
  //         }

  //         bot.reply(message, botMsg);
  //       }
  //     };

  //     const query = {
  //       likes: 1,
  //       created_time: 1,
  //       'caption.text': 1,
  //       link: 1,
  //     };

  //     QueryUtil.getMediasByTimerange(app.locals.mongoDriver.db, params, query, callback);
  //   } else {
  //     bot.reply(message, 'Tanggal input tidak valid!');
  //   }
  // });

  // Get total likes of posts in a timerange
  // botController.hears(['!count'], [ambient], (bot, message) => {
  //   LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

  //   const params = setParamsFromMessage(message);

  //   if (isDateValid(params.startDate) && isDateValid(params.endDate)) {
  //     const callback = (json) => {
  //       if (json.success) {
  //         const {
  //           startDate: start,
  //           endDate: end,
  //           totalLikes,
  //         } = json.data;

  //         bot.reply(
  //           message,
  //           `Total post likes count dari ${start} hingga ${end} ada ${totalLikes}.`
  //         );
  //       }
  //     };

  //     QueryUtil.getTotalLikesInPeriod(app.locals.mongoDriver.db, params, callback);
  //   } else {
  //     bot.reply(message, 'Tanggal input tidak valid!');
  //   }
  // });

  // // Get post(s) with the most likes in a timerange
  // botController.hears(['!mostlikes'], [ambient], (bot, message) => {
  //   LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

  //   const params = setParamsFromMessage(message);

  //   if (isDateValid(params.startDate) && isDateValid(params.endDate)) {
  //     const callback = (json) => {
  //       if (json.success) {
  //         const {
  //           startDate: start,
  //           endDate: end,
  //           posts,
  //         } = json.data;

  //         const length = posts.length;
  //         let botMsg = '';

  //         if (length) {
  //           posts.forEach((post, i) => {
  //             const { link, date, likes, text } = post;
  //             // Manually concat for each post
  //             botMsg += `${i + 1}. ${link} (${date}) - ${likes} likes\n` +
  //                     `${text}`;

  //             // Add newline if it is not the last element
  //             botMsg += (i + 1 < length) ? '\n' : '';
  //           });
  //         } else {
  //           botMsg = `Tidak ada post dari ${start} hingga ${end}`;
  //         }

  //         bot.reply(message, botMsg);
  //       }
  //     };

  //     QueryUtil.getMostLikedPosts(app.locals.mongoDriver.db, params, callback);
  //   } else {
  //     bot.reply(message, 'Tanggal input tidak valid!');
  //   }
  // });

  // Get post(s) with the most likes in a timerange
  // botController.hears(['!followers'], [ambient], (bot, message) => {
  //   LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

  //   const params = setParamsFromMessage(message);

  //   if (isDateValid(params.startDate) && isDateValid(params.endDate)) {
  //     const callback = (json) => {
  //       if (json.success) {
  //         const data = json.data;
  //         const length = data.length;
  //         let botMsg = '';

  //         if (length) {
  //           const start = formatDatetime(moment.unix(data[0].time));
  //           const end = formatDatetime(moment.unix(data[length - 1].time));

  //           botMsg = `Jumlah followers dari *${start}* hingga *${end}*:\n`;

  //           data.forEach((followersDay, i) => {
  //             const { time, followers_count: followersCount } = followersDay;
  //             const timeFormat = formatDatetime(moment.unix(time));

  //             botMsg += `${i + 1}. *${timeFormat}*: *${followersCount}* akun.\n`;
  //           });
  //         } else {
  //           botMsg = 'Query tidak dapat menemukan data yang diminta. Silahkan coba lagi.';
  //         }

  //         bot.reply(message, botMsg);
  //       }
  //     };

  //     QueryUtil.getFollowersCountSince(app.locals.mongoDriver.db, params, callback);
  //   } else {
  //     bot.reply(message, 'Tanggal input tidak valid!');
  //   }
  // });
} else {
  // Local/development mode
  LogUtil.winston.log('info', 'No production environment is detected. Slackbot is not running.');
}
