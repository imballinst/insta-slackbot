// Import modules
const moment = require('moment');

const { generalHelpText } = require('../libs/constants/HelpTexts');

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

    processMessage(app.locals.mongoDriver.db, message)
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
      }).catch((err) => {
        winstonError(err);

        bot.reply(message, err);
      });
  });

  // Get total likes of posts in a timerange
  botController.hears(['!countlikes'], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message)
      .then(({ posts, params }) => {
        const { startDate, endDate } = params;

        const totalLikes = `*${posts.reduce((sum, val) => sum + val.likes, 0)}*`;

        bot.reply(
          message,
          `Total post likes count dari ${startDate} hingga ${endDate} ada ${totalLikes}.`
        );
      }).catch((err) => {
        winstonError(err);

        bot.reply(message, err);
      });
  });

  // Get post(s) with the most likes in a timerange
  botController.hears(['!mostlikes'], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message)
      .then(({ posts, params, helpText }) => {
        // If help text is not defined
        if (!helpText) {
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
        } else {
          bot.reply(message, helpText);
        }
      }).catch((err) => {
        winstonError(err);

        bot.reply(message, err);
      });
  });

  /*
   * Administration Commands
   */

  // Help
  const helpEventRegex = /^(help|daftar perintah|bantuan)$/g;

  botController.hears([helpEventRegex], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    bot.reply(message, generalHelpText);
  });

  // Get admins
  const listAdminsRegex = /^(daftar (admin|admins)|list (admin|admins))$/g;

  botController.hears([listAdminsRegex], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message)
      .then(({ admins, helpText }) => {
        let botMsg = '';

        // If help text is not defined
        if (!helpText) {
          const length = admins.length;

          botMsg = 'List admin yang terdaftar:\n';

          // iterate to botMsg
          admins.forEach((admin, i) => {
            // Manually concat for each post
            botMsg += `${i + 1}. ${admin}`;

            // Add newline if it is not the last element
            botMsg += (i + 1 < length) ? '\n' : '';
          });
        } else {
          botMsg = helpText;
        }

        bot.reply(message, botMsg);
      }).catch((err) => {
        winstonError(err);

        bot.reply(message, err);
      });
  });

  // Set admin
  botController.hears(['!promote'], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message)
      .then(({ username, helpText }) => {
        let botMsg;

        // If help text is not defined
        if (!helpText) {
          botMsg = `Sukses menaikkan ${username} menjadi admin!`;
        } else {
          botMsg = helpText;
        }

        bot.reply(message, botMsg);
      }).catch((err) => {
        winstonError(err);

        bot.reply(message, err);
      });
  });

  botController.hears(['!demote'], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message)
      .then(({ username, helpText }) => {
        let botMsg;

        // If help text is not defined
        if (!helpText) {
          botMsg = `Sukses menurunkan ${username} dari jabatan admin!`;
        } else {
          botMsg = helpText;
        }

        bot.reply(message, botMsg);
      }).catch((err) => {
        winstonError(err);

        bot.reply(message, err);
      });
  });

  // Get channels
  botController.hears(['!channels'], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message)
      .then(({ channels, helpText }) => {
        let botMsg = '';

        // If help text is not defined
        if (!helpText) {
          const length = channels.length;
          botMsg = 'List public channels yang terdaftar untuk broadcast:\n';

          // iterate to botMsg
          channels.forEach((channel, i) => {
            // Manually concat for each post
            botMsg += `${i + 1}. ${channel}`;

            // Add newline if it is not the last element
            botMsg += (i + 1 < length) ? '\n' : '';
          });
        } else {
          botMsg = helpText;
        }

        bot.reply(message, botMsg);
      }).catch((err) => {
        winstonError(err);

        bot.reply(message, err);
      });
  });

  // Set channel
  botController.hears(['!setbroadcast'], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message)
      .then(({ channelName, broadcastStatus, helpText }) => {
        let botMsg;

        // If help text is not defined
        if (!helpText) {
          const toggleText = broadcastStatus === 0 ? 'biasa' : 'broadcast';

          botMsg = `Sukses menjadikan channel ${channelName} menjadi channel ${toggleText}!`;
        } else {
          botMsg = helpText;
        }

        bot.reply(message, botMsg);
      }).catch((err) => {
        winstonError(err);

        bot.reply(message, err);
      });
  });
} else {
  // Local/development mode
  winstonInfo('No production environment is detected. Slackbot is not running.');
}
