const moment = require('moment');

// Import modules
const LogUtil = require('../libs/LogUtil');
const BotLibs = require('../libs/Botkit');
const InstagramDriver = require('../libs/InstagramDriver');
const QueryUtil = require('../libs/QueryUtil');

const app = require('../app');

const slackChannelID = process.env.SLACK_CHANNEL;

// Destructure functions
const getMediaById = InstagramDriver.getMediaById;

// Get node environment
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
        throw new Error(err);
      }
    });
  };

  // Start the real-time messaging
  startRTM();

  // Start the real-time messaging if it is closed
  botController.on('close_rtm', () => {
    LogUtil.winston.log('info', 'RTM closed. Restarting RTM now!');

    startRTM();
  });

  // On route hit
  app.post('/callback-sub', (req, res) => {
    // JSON Object of POST data
    const mediaID = req.body['0'].data.media_id;
    LogUtil.winston.log('info', 'Got POST request from Instagram Subscriptions: ', req.body);

    const callback = (json) => {
      app.locals.mongoDriver.db.collection('postedmedias').insertOne(json);
      res.send();

      botInstance.say({
        text: 'Dapet subscribe nih',
        channel: slackChannelID,
      });
    };

    getMediaById(mediaID, callback);
  });

  // List events
  const ambient = 'ambient';

  // Helpers functions
  const isDateValid = string => moment(string, 'DD-MM-YYYY').isValid();

  const setTimeParamsFromMessage = (message) => {
    // Set default if not defined to start of and end of week
    const [,
      startDate = moment().startOf('week'),
      endDate = moment().endOf('week'),
    ] = message.text.split(' ');

    return { startDate, endDate };
  };

  const formatDatetime = momentObject => momentObject.format('dddd, Do MMMM YYYY');

  // On receive events
  // Help
  botController.hears(['!help'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const textArrays = [
      '*Aturan Umum*: format tanggal *t1* dan *t2* yang valid adalah _DD-MM-YYYY_ (tanpa kurung siku). Apabila tidak dimasukkan, maka *t1* dan *t2* bernilai awal dan akhir dari minggu ini.\n',
      '1. *!help*: Memunculkan list _command_ yang ada,',
      '2. *!review [t1] [t2]*: Memunculkan review post-post sejak *t1* hingga *t2*,',
      '3. *!count [t1] [t2]*: Menghitung jumlah likes dari post-post sejak *t1* hingga *t2*,',
      '4. *!mostlikes [t1] [t2]*: Mencari post-post yang memiliki jumlah likes paling banyak.',
    ];
    const text = textArrays.join('\n');

    bot.reply(message, text);
  });

  // Week review
  botController.hears(['!review'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const timeParams = setTimeParamsFromMessage(message);
    const { startDate, endDate } = timeParams;

    if (isDateValid(startDate) && isDateValid(endDate)) {
      // If the dates are valid or if review is not defined; it is current week
      const callback = (err, posts, momentProps) => {
        if (!err) {
          const {
            startDateMoment: start,
            endDateMoment: end,
          } = momentProps;
          const length = posts.length;
          let botMsg = `Weekly review dari ${formatDatetime(start)} ` +
            `hingga ${formatDatetime(end)}:\n`;

          if (length) {
            posts.forEach((post, i) => {
              const {
                link,
                created_time: date,
                likes,
                caption,
              } = post.data;
              const createdAt = formatDatetime(moment.unix(date));

              // Manually concat for each post
              botMsg += `${i + 1}. ${link} (${createdAt}) - ${likes.count} likes\n` +
                      `${caption.text}`;

              // Add newline if it is not the last element
              botMsg += (i + 1 < length) ? '\n' : '';
            });
          } else {
            botMsg = `Tidak ada post dari ${formatDatetime(start)} hingga ${formatDatetime(end)}`;
          }

          bot.reply(message, botMsg);
        }
      };

      const query = {
        'data.likes': 1,
        'data.created_time': 1,
        'data.caption.text': 1,
        'data.link': 1,
      };

      QueryUtil.getMediasByTimerange(app.locals.mongoDriver.db, timeParams, query, callback);
    } else {
      bot.reply(message, 'Tanggal input tidak valid!');
    }
  });

  // Get total likes of posts in a timerange
  botController.hears(['!count'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const timeParams = setTimeParamsFromMessage(message);
    const { startDate, endDate } = timeParams;

    if (isDateValid(startDate) && isDateValid(endDate)) {
      const callback = (json) => {
        if (json.success) {
          const {
            startDate: start,
            endDate: end,
            totalLikes,
          } = json.data;

          bot.reply(
            message,
            `Total post likes count dari ${start} hingga ${end} ada ${totalLikes}.`
          );
        }
      };

      QueryUtil.getTotalLikesInPeriod(app.locals.mongoDriver.db, timeParams, callback);
    } else {
      bot.reply(message, 'Tanggal input tidak valid!');
    }
  });

  // Get post(s) with the most likes in a timerange
  botController.hears(['!mostlikes'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const timeParams = setTimeParamsFromMessage(message);
    const { startDate, endDate } = timeParams;

    if (isDateValid(startDate) && isDateValid(endDate)) {
      const callback = (json) => {
        if (json.success) {
          const {
            startDate: start,
            endDate: end,
            posts,
          } = json.data;

          const length = posts.length;
          let botMsg = '';

          if (length) {
            posts.forEach((post, i) => {
              const { link, date, likes, text } = post;
              // Manually concat for each post
              botMsg += `${i + 1}. ${link} (${date}) - ${likes} likes\n` +
                      `${text}`;

              // Add newline if it is not the last element
              botMsg += (i + 1 < length) ? '\n' : '';
            });
          } else {
            botMsg = `Tidak ada post dari ${formatDatetime(start)} hingga ${formatDatetime(end)}`;
          }

          bot.reply(message, botMsg);
        }
      };

      QueryUtil.getMostLikedPosts(app.locals.mongoDriver.db, timeParams, callback);
    } else {
      bot.reply(message, 'Tanggal input tidak valid!');
    }
  });
} else {
  // Local/development mode
  LogUtil.winston.log('info', 'No production environment is detected. Slackbot is not running.');
}
