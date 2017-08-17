// Import modules
const moment = require('moment');

const { winstonInfo, winstonError } = require('../libs/LogUtil');
const BotLibs = require('../libs/Botkit');

const { getMediaById } = require('../libs/InstagramQueries');
const {
  // getFollowersCount,
  getChannels,
} = require('../libs/MongoQueries');
const { processMessage, batchReply } = require('../libs/MessageUtil');

// Require app
const app = require('../app');

// Get node environment
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  // If app is running in production mode
  winstonInfo('Production environment detected. Starting Slackbot.');

  // Initialize the bot
  BotLibs.init();

  const botInstance = BotLibs.instance;
  const botController = BotLibs.controller;

  // Start RTM function
  const startRTM = () => {
    botInstance.startRTM((err) => {
      if (err) {
        winstonError(err);
      }
    });
  };

  // Start the real-time messaging
  startRTM();

  // Start the real-time messaging if it is closed
  botController.on('rtm_close', () => {
    winstonInfo('RTM closed. Restarting RTM now!');

    startRTM();
  });

  // On route hit
  app.post('/callback-sub', (req, res) => {
    winstonInfo('Got POST request from Instagram Subscriptions: ', req.body);

    // JSON Object of POST data
    const mediaID = req.body['0'].data.media_id;

    getMediaById(mediaID)
      .then((response) => {
        const jsonObject = JSON.parse(response);
        const { data, meta } = jsonObject;

        if (meta.code === 200) {
          // If media exists
          const { id, created_time: createdTime, link, caption } = data;
          const text = caption ? `\n\n"${caption.text}"` : '';

          app.locals.mongoDriver.db.collection('postedmedias').insertOne({
            id,
            created_time: new Date(moment.unix(parseInt(createdTime, 10)).toISOString()),
          });

          res.send();

          return getChannels(app.locals.mongoDriver.db)
            .then((dbResponse) => {
              dbResponse.data.forEach((channel) => {
                botInstance.say({
                  text: `Ada post baru nih di Instagram! ${link} ${text}`,
                  channel: channel.channel_id,
                });
              });
            });
        }
          // If media doesn't exist
        throw new Error('Media not found!');
      });
  });

  // List events
  const events = ['direct_message'];

  /*
   * Media Commands
   */
  botController.hears(['!review'], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(bot, app.locals.mongoDriver.db, message)
      .then(({ posts, params }) => {
        const { startDate, endDate, sort } = params;

        // let botMsg = '';
        let sortedPosts = posts;

        if (sort) {
          const [sortFieldInput, sortOrder] = sort.split(':');
          const orderArray = sortOrder === 'asc' ? [1, -1] : [-1, 1];

          const sortField = sortFieldInput === 'time' ? 'created_time' : sortFieldInput;

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

        bot.reply(message, `Review dari ${startDate} hingga ${endDate}:\n`, (err) => {
          if (!err) {
            batchReply(bot, message, sortedPosts, 0);
          } else {
            bot.reply(message, err);
          }
        });
      }).catch(err => bot.reply(message, err));
  });

  // Get total likes of posts in a timerange
  botController.hears(['!countlikes'], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(bot, app.locals.mongoDriver.db, message)
      .then(({ posts, params }) => {
        const { startDate, endDate } = params;

        const totalLikes = `*${posts.reduce((sum, val) => sum + val.likes, 0)}*`;

        bot.reply(
          message,
          `Total post likes count dari ${startDate} hingga ${endDate} ada ${totalLikes}.`
        );
      }).catch(err => bot.reply(message, err));
  });

  // Get post(s) with the most likes in a timerange
  botController.hears(['!mostlikes'], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(bot, app.locals.mongoDriver.db, message)
      .then(({ posts, params }) => {
        const { startDate, endDate } = params;

        let mostLikedPosts = [];

        posts.reduce((maxLikes, curDoc) => {
          const {
            link,
            created_time: createdAt,
            likes,
            caption,
            tags,
            comments,
          } = curDoc;

          if (likes >= maxLikes) {
            if (likes > maxLikes) { mostLikedPosts = []; }

            // For immutability
            mostLikedPosts = mostLikedPosts.concat({
              link,
              created_time: createdAt,
              likes,
              caption,
              tags,
              comments,
            });
          }

          // Return the maximum number of likes
          return Math.max(maxLikes, curDoc.likes);
        }, -Infinity);

        bot.reply(
          message,
          `Post dengan likes terbanyak dari ${startDate} hingga ${endDate}:\n`,
          (err) => {
            if (!err) {
              batchReply(bot, message, mostLikedPosts, 0);
            }
          }
        );
      }).then(err => bot.reply(message, err));
  });

  /*
   * Administration Commands
   */

  // Help
  botController.hears(['!help'], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    const textArrays = [
      'Ada dua tipe perintah, yaitu perintah administratif dan perintah query Instagram.',
      '\t1. *Perintah administratif*',
      '\t\t• `!help`: Memberikan daftar perintah-perintah yang dapat diinput oleh admin',
      '\t\t• `!admins`: Menampilkan daftar admin yang berhak memberikan perintah',
      '\t\t• `!promote`: Memberikan akses admin kepada seorang user',
      '\t\t• `!demote`: Mencabut akses admin dari seorang user',
      '\t\t• `!channels`: Menampilkan daftar channel tempat output dari post-post Instagram',
      '\t\t• `!setbroadcast`: Menentukan channel tempat output dari post-post Instagram',
      '\t2. *Perintah query Instagram*',
      '\t\t• `!review`: Melakukan rekapitulasi post-post dari kurun waktu tertentu',
      '\t\t• `!mostlikes`: Mencari post-post dengan jumlah likes terbanyak dari kurun waktu tertentu',
      '\t\t• `!countlikes`: Menghitung jumlah post likes  dari kurun waktu tertentu',
      // '\t\t• `!followers`: Melakukan rekapitulasi jumlah followers per harinya dari kurun waktu tertentu',
      'Untuk mengetahui detil perintah, ketik perintah tersebut diikuti dengan *--help*. Contoh: `!promote --help`',
    ];
    const text = textArrays.join('\n');

    bot.reply(message, text);
  });

  // Get admins
  botController.hears(['!admins'], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(bot, app.locals.mongoDriver.db, message)
      .then(({ admins }) => {
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
      }).catch(err => bot.reply(message, err));
  });

  // Set admin
  botController.hears(['!promote'], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(bot, app.locals.mongoDriver.db, message)
      .then(({ username }) => {
        const botMsg = `Sukses menaikkan ${username} menjadi admin!`;

        bot.reply(message, botMsg);
      }).catch(err => bot.reply(message, err));
  });

  botController.hears(['!demote'], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(bot, app.locals.mongoDriver.db, message)
      .then(({ username }) => {
        const botMsg = `Sukses menurunkan ${username} dari jabatan admin!`;

        bot.reply(message, botMsg);
      }).catch(err => bot.reply(message, err));
  });

  // Get channels
  botController.hears(['!channels'], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(bot, app.locals.mongoDriver.db, message)
      .then((channels) => {
        const length = channels.length;
        let botMsg = '';

        if (length) {
          botMsg = 'List public channels yang terdaftar untuk broadcast:\n';

          // iterate to botMsg
          channels.forEach((channel, i) => {
            // Manually concat for each post
            botMsg += `${i + 1}. ${channel}`;

            // Add newline if it is not the last element
            botMsg += (i + 1 < length) ? '\n' : '';
          });
        } else {
          botMsg = 'Tidak ada public channel yang terdaftar untuk broadcast.';
        }

        bot.reply(message, botMsg);
      }).catch(err => bot.reply(message, err));
  });

  // Set channel
  botController.hears(['!setbroadcast'], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(bot, app.locals.mongoDriver.db, message)
      .then(({ channelName, broadcastStatus }) => {
        const toggleText = broadcastStatus === '0' ? 'biasa' : 'broadcast';
        const botMsg = `Sukses menjadikan channel ${channelName} menjadi channel ${toggleText}!`;

        bot.reply(message, botMsg);
      }).catch(err => bot.reply(message, err));
  });
} else {
  // Local/development mode
  winstonInfo('No production environment is detected. Slackbot is not running.');
}
