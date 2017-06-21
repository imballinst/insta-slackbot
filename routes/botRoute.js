const moment = require('moment');

// Import modules
const LogUtil = require('../libs/LogUtil');
const BotLibs = require('../libs/Botkit');
const InstagramDriver = require('../libs/InstagramDriver');
const QueryUtil = require('../libs/QueryUtil');

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
      app.locals.mongoDriver.db.collection('postedmedias').insertOne(json);
      res.send();

      botInstance.say({
        text: `Ada post baru nih di Instagram! ${json.link}\n\n${json.caption.text}`,
        channel: slackChannelID,
      });
    };

    getMediaById(mediaID, callback);
  });

  // List events
  const ambient = 'ambient';

  // Helpers functions
  const isDateValid = string => moment(string, 'DD-MM-YYYY').isValid();

  const setParamsFromMessage = (message) => {
    // Set default if not defined to start of and end of week
    const defaultStartDate = moment()
      .hour(0)
      .minute(0)
      .second(0)
      .startOf('week');
    const defaultEndDate = moment()
      .hour(0)
      .minute(0)
      .second(0)
      .endOf('week');

    const [,
      startDate = defaultStartDate,
      endDate = defaultEndDate,
      sort,
    ] = message.text.split(' ');

    return { startDate, endDate, sort };
  };

  const formatDatetime = momentObject => momentObject.format('dddd, Do MMMM YYYY');

  // On receive events
  // Help
  botController.hears(['!help'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const textArrays = [
      '*Format Query:* _[command]_ _[t1]_ _[t2]_ _[sort]_',
      '  • _[command]_ *(wajib)*: adalah perintah yang diberikan kepada bot.',
      '     1. *!help*: Memunculkan list _command_ yang ada,',
      '     2. *!review*: Memunculkan review post-post sejak _[t1]_ hingga _[t2]_,',
      '     3. *!count*: Menghitung jumlah likes dari post-post sejak _[t1]_ hingga _[t2]_,',
      '     4. *!mostlikes*: Mencari post-post yang memiliki jumlah likes paling banyak sejak _[t1]_ hingga _[t2]_.',
      '  • _[t1]_ *(opsional)*:, waktu awal dengan format _DD-MM-YYYY_. *Default*: hari Senin pada minggu ini.',
      '  • _[t2]_ *(opsional)*:, waktu akhir dengan format _DD-MM-YYYY_. *Default*: hari Minggu pada minggu ini.',
      '  • _[sort]_ *(opsional)*:, mengurutkan hasil query berdasarkan atribut dengan format _[field]-[order]_. *Default*: unsorted.',
      '     1. *[field]*: pilihan field yang dapat diurutkan diantaranya *time*, *likes*, *comments*, *tags*,',
      '     2. *[order]*: pilihan order, yaitu *asc* (kecil ke besar) dan *desc* (besar ke kecil).\n',
      '*Contoh Query:* !review 07-06-2017 15-06-2017 sort:likes-asc',
    ];
    const text = textArrays.join('\n');

    bot.reply(message, text);
  });

  // Week review
  botController.hears(['!review'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const params = setParamsFromMessage(message);

    if (isDateValid(params.startDate) && isDateValid(params.endDate)) {
      // If the dates are valid or if review is not defined; it is current week
      const callback = (err, posts, momentProps) => {
        if (!err) {
          const {
            startDateMoment: start,
            endDateMoment: end,
          } = momentProps;
          const length = posts.length;
          let botMsg = '';

          if (length) {
            botMsg = `Review dari ${formatDatetime(start)} hingga ${formatDatetime(end)}:\n`;

            posts.forEach((post, i) => {
              const {
                link,
                created_time: date,
                likes,
                caption,
              } = post;
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
        likes: 1,
        created_time: 1,
        'caption.text': 1,
        link: 1,
      };

      QueryUtil.getMediasByTimerange(app.locals.mongoDriver.db, params, query, callback);
    } else {
      bot.reply(message, 'Tanggal input tidak valid!');
    }
  });

  // Get total likes of posts in a timerange
  botController.hears(['!count'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const params = setParamsFromMessage(message);

    if (isDateValid(params.startDate) && isDateValid(params.endDate)) {
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

      QueryUtil.getTotalLikesInPeriod(app.locals.mongoDriver.db, params, callback);
    } else {
      bot.reply(message, 'Tanggal input tidak valid!');
    }
  });

  // Get post(s) with the most likes in a timerange
  botController.hears(['!mostlikes'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const params = setParamsFromMessage(message);

    if (isDateValid(params.startDate) && isDateValid(params.endDate)) {
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
            botMsg = `Tidak ada post dari ${start} hingga ${end}`;
          }

          bot.reply(message, botMsg);
        }
      };

      QueryUtil.getMostLikedPosts(app.locals.mongoDriver.db, params, callback);
    } else {
      bot.reply(message, 'Tanggal input tidak valid!');
    }
  });

  // Get post(s) with the most likes in a timerange
  botController.hears(['!followers'], [ambient], (bot, message) => {
    LogUtil.winston.log('info', `Message: ${JSON.stringify(message)}`);

    const params = setParamsFromMessage(message);

    if (isDateValid(params.startDate) && isDateValid(params.endDate)) {
      const callback = (json) => {
        if (json.success) {
          const data = json.data;
          const length = data.length;
          let botMsg = '';

          if (length) {
            const start = formatDatetime(moment.unix(data[0].time));
            const end = formatDatetime(moment.unix(data[length - 1].time));

            botMsg = `Jumlah followers dari *${start}* hingga *${end}*:\n`;

            data.forEach((followersDay, i) => {
              const { time, followers_count: followersCount } = followersDay;
              const timeFormat = formatDatetime(moment.unix(time));

              botMsg += `${i + 1}. *${timeFormat}*: *${followersCount}* akun.\n`;
            });
          } else {
            botMsg = 'Query tidak dapat menemukan data yang diminta. Silahkan coba lagi.';
          }

          bot.reply(message, botMsg);
        }
      };

      QueryUtil.getFollowersCountSince(app.locals.mongoDriver.db, params, callback);
    } else {
      bot.reply(message, 'Tanggal input tidak valid!');
    }
  });
} else {
  // Local/development mode
  LogUtil.winston.log('info', 'No production environment is detected. Slackbot is not running.');
}
