// Import modules
const moment = require('moment');

const LogUtil = require('../libs/LogUtil');
const BotLibs = require('../libs/Botkit');

const { getMediaById } = require('../libs/InstagramDriver');
const {
  // getFollowersCount,
  getChannels,
} = require('../libs/MongoQueries');
const { processMessage, formatDatetime } = require('../libs/MessageUtil');

// Require app
const app = require('../app');

// Get node environment
// const slackChannelID = process.env.SLACK_CHANNEL;
const isProd = process.env.NODE_ENV === 'production';

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
        const { id, created_time: createdTime, link, caption } = data;

        app.locals.mongoDriver.db.collection('postedmedias').insertOne({
          id,
          created_time: createdTime,
        });

        res.send();

        const getChannelsCallback = (dbResponse) => {
          dbResponse.data.forEach((channel) => {
            botInstance.say({
              text: `Ada post baru nih di Instagram! ${link}\n\n"${caption.text}"`,
              channel: channel.channel_id,
            });
          });
        };

        getChannels(app.locals.mongoDriver.db, getChannelsCallback);
      } else {
        // If media doesn't exist
        LogUtil.winston.log('error', 'Media not found!');
      }
    };

    getMediaById(mediaID, callback);
  });

  // List events
  const ambient = 'ambient';

  /*
   * Media Commands
   */
  botController.hears(['!review'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const onSuccess = (posts, params) => {
      const { startDate, endDate, sort } = params;

      const start = `*${formatDatetime(moment(startDate, 'DD-MM-YYYY'))}*`;
      const end = `*${formatDatetime(moment(endDate, 'DD-MM-YYYY'))}*`;

      let botMsg = '';
      let sortedPosts = posts;

      const length = sortedPosts.length;

      if (length) {
        botMsg = `Review dari ${start} hingga ${end}:\n`;

        if (sort) {
          // Sort by defined field if defined
          const [sortField, sortOrder] = sort.split(':');
          const orderArray = sortOrder === 'asc' ? [-1, 1] : [1, -1];

          sortedPosts = posts.sort((a, b) => {
            if (a[sortField] > b[sortField]) {
              return orderArray[0];
            }

            return orderArray[1];
          });
        } else {
          // Sort by date if not defined
          sortedPosts = posts.sort((a, b) => {
            if (a.created_time > b.created_time) {
              return 1;
            }

            return -1;
          });
        }

        sortedPosts.forEach((post, i) => {
          const {
            link,
            created_time: date,
            likes,
            caption,
          } = post;
          const createdAt = `*${formatDatetime(moment.unix(date))}*`;
          const captionText = (caption) ? caption.text : '';

          // Manually concat for each post
          botMsg += `${i + 1}. ${link} (${createdAt}) - *${likes.count}* likes\n ${captionText}`;

          // Add newline if it is not the last element
          botMsg += (i + 1 < length) ? '\n' : '';
        });
      } else {
        botMsg = `Tidak ada post dari ${start} hingga ${end}`;
      }

      bot.reply(message, botMsg);
    };

    processMessage(bot, app.locals.mongoDriver.db, message, onSuccess);
  });

  // Get total likes of posts in a timerange
  botController.hears(['!countlikes'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const onSuccess = (posts, params) => {
      const length = posts.length;
      const { startDate, endDate } = params;

      const start = `*${formatDatetime(moment(startDate, 'DD-MM-YYYY'))}*`;
      const end = `*${formatDatetime(moment(endDate, 'DD-MM-YYYY'))}*`;

      let botMsg = '';

      if (length) {
        const totalLikes = `*${posts.reduce((sum, val) => sum + val.likes.count, 0)}*`;

        botMsg = `Total post likes count dari ${start} hingga ${end} ada ${totalLikes}.`;
      } else {
        botMsg = `Tidak ada post dari ${start} hingga ${end}.`;
      }

      bot.reply(message, botMsg);
    };

    processMessage(bot, app.locals.mongoDriver.db, message, onSuccess);
  });

  // // Get post(s) with the most likes in a timerange
  botController.hears(['!mostlikes'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const onSuccess = (posts, params) => {
      const length = posts.length;
      const { startDate, endDate } = params;

      const start = `*${formatDatetime(moment(startDate, 'DD-MM-YYYY'))}*`;
      const end = `*${formatDatetime(moment(endDate, 'DD-MM-YYYY'))}*`;

      let botMsg = '';

      if (length) {
        let mostLikedPosts = [];

        // fill mostLikedPosts with the post with maxLikes
        posts.reduce((maxLikes, curDoc) => {
          // If likes of current post is higher, push to mostLikedPosts
          const {
            link,
            created_time: createdAt,
            likes,
            caption,
          } = curDoc;

          if (likes.count >= maxLikes) {
            if (likes.count > maxLikes) {
              mostLikedPosts = [];
            }

            // For immutability
            mostLikedPosts = mostLikedPosts.concat({
              link,
              dateMoment: moment.unix(createdAt),
              likesCount: likes.count,
              caption,
            });
          }

          // Return the maximum number of likes
          return Math.max(maxLikes, curDoc.likes.count);
        }, -Infinity);

        // iterate to botMsg
        mostLikedPosts.forEach((post, i) => {
          const { link, dateMoment, likesCount, caption } = post;
          const createdAt = `*${formatDatetime(dateMoment)}*`;
          const captionText = (caption) ? caption.text : '';

          // Manually concat for each post
          botMsg += `${i + 1}. ${link} (${createdAt}) - *${likesCount}* likes\n ${captionText}`;

          // Add newline if it is not the last element
          botMsg += (i + 1 < length) ? '\n' : '';
        });
      } else {
        botMsg = `Tidak ada post dari ${start} hingga ${end}`;
      }

      bot.reply(message, botMsg);
    };

    processMessage(bot, app.locals.mongoDriver.db, message, onSuccess);
  });

  // Get post(s) with the most likes in a timerange
  // botController.hears(['!followers'], [ambient], (bot, message) => {
  //   LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

  //   const executedFunction = (params) => {
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

  //     getFollowersCount(app.locals.mongoDriver.db, params, callback);
  //   };

  //   processMessage(bot, message, executedFunction);
  // });

  /*
   * Administration Commands
   */

  // Help
  botController.hears(['!help'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const textArrays = [
      'Ada dua tipe perintah, yaitu perintah administratif dan perintah query Instagram.',
      '\t*1. Perintah administratif*',
      '\t\t• `!help`: Memberikan daftar perintah-perintah yang dapat diinput oleh admin',
      '\t\t• `!admins`: Menampilkan daftar admin yang berhak memberikan perintah',
      '\t\t• `!promote`: Memberikan akses admin kepada seorang user',
      '\t\t• `!demote`: Mencabut akses admin dari seorang user',
      '\t\t• `!channels`: Menampilkan daftar channel tempat output dari post-post Instagram',
      '\t\t• `!setbroadcast`: Menentukan channel tempat output dari post-post Instagram',
      '\t*2. Perintah query Instagram*',
      '\t\t• `!review`: Melakukan rekapitulasi post-post dari kurun waktu tertentu',
      '\t\t• `!mostlikes`: Mencari post-post dengan jumlah likes terbanyak dari kurun waktu tertentu',
      '\t\t• `!count`: Menghitung jumlah post dari kurun waktu tertentu',
      // '\t\t• `!followers`: Melakukan rekapitulasi jumlah followers per harinya dari kurun waktu tertentu',
      'Untuk mengetahui detil perintah, ketik perintah tersebut diikuti dengan *--help*. Contoh: `!promote --help`',
    ];
    const text = textArrays.join('\n');

    bot.reply(message, text);
  });

  // Get admins
  botController.hears(['!admins'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const onSuccess = (admins) => {
      const length = admins.length;
      let botMsg = '';

      if (length) {
        botMsg = 'List admin yang terdaftar:\n';

        // iterate to botMsg
        admins.forEach((admin, i) => {
          // Manually concat for each post
          botMsg += `${i + 1}. ${admin}`;

          // Add newline if it is not the last element
          botMsg += (i + 1 < length) ? '\n' : '';
        });
      } else {
        botMsg = 'Tidak ada admin yang terdaftar.';
      }

      bot.reply(message, botMsg);
    };

    processMessage(bot, app.locals.mongoDriver.db, message, onSuccess);
  });

  // Set admin
  botController.hears(['!promote'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const onSuccess = (success, username) => {
      const botMsg = success ?
        `Sukses menaikkan ${username} menjadi admin!` :
        `Gagal menaikkan ${username} menjadi admin`;

      bot.reply(message, botMsg);
    };

    processMessage(bot, app.locals.mongoDriver.db, message, onSuccess);
  });

  botController.hears(['!demote'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const onSuccess = (success, username) => {
      const botMsg = success ?
        `Sukses menurunkan ${username} dari jabatan admin!` :
        `Gagal menurunkan ${username} dari jabatan admin.`;

      bot.reply(message, botMsg);
    };

    processMessage(bot, app.locals.mongoDriver.db, message, onSuccess);
  });

  // Get channels
  botController.hears(['!channels'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const onSuccess = (channels) => {
      const length = channels.length;
      let botMsg = '';

      if (length) {
        botMsg = 'List channels yang terdaftar untuk broadcast:\n';

        // iterate to botMsg
        channels.forEach((channel, i) => {
          // Manually concat for each post
          botMsg += `${i + 1}. ${channel}`;

          // Add newline if it is not the last element
          botMsg += (i + 1 < length) ? '\n' : '';
        });
      } else {
        botMsg = 'Tidak ada channel yang terdaftar.';
      }

      bot.reply(message, botMsg);
    };

    processMessage(bot, app.locals.mongoDriver.db, message, onSuccess);
  });

  // Set channel
  botController.hears(['!setbroadcast'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const onSuccess = (success, channel, status) => {
      const toggleText = status === '0' ? 'biasa' : 'broadcast';
      const botMsg = success ?
        `Sukses menjadikan channel ${channel} menjadi channel ${toggleText}!` :
        `Gagal menjadikan channel ${channel} menjadi channel ${toggleText}.`;

      bot.reply(message, botMsg);
    };

    processMessage(bot, app.locals.mongoDriver.db, message, onSuccess);
  });
} else {
  // Local/development mode
  LogUtil.winston.log('info', 'No production environment is detected. Slackbot is not running.');
}
