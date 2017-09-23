const Twit = require('twit');
const moment = require('moment');

const { events, commandRegexes } = require('../../libs/constants/Commands');
const { broadcastMessages } = require('../../libs/constants/CommonVariables');

const { winstonInfo, winstonError } = require('../../libs/LogUtil');
const {
  addKeywords,
  removeKeywords,
  getKeywords,
  getAdmins,
} = require('../../libs/MongoQueries');
const { processMessage } = require('../../libs/MessageUtil');

const consumerKey = process.env.TWITTER_CONSUMER_KEY;
const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
const accessToken = process.env.TWITTER_ACCESS_TOKEN;
const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
const slackAdminId = process.env.SLACK_ADMIN_ID;

function addTweetEvent(app, streamObj, botInstance, twitterController) {
  const trackedWords = app.locals.keywords;

  if (typeof streamObj.wordStream !== 'undefined') {
    streamObj.wordStream.stop();
  }

  streamObj.wordStream = twitterController.stream('statuses/filter', { track: trackedWords });
  streamObj.wordStream.on('tweet', (tweet) => {
    const {
      timestamp_ms: timestampMs,
      id_str: tweetId,
      text: tweetText,
      user,
    } = tweet;
    const { name: realName, screen_name: accountName } = user;

    winstonInfo(`Tweet from ${realName} [${tweetId}]: ${tweetText}`);

    // Assemble tweet message for Slack
    const tsMillisecond = timestampMs.substr(0, timestampMs.length - 3);
    const displayFormat = 'dddd, MMMM Do YYYY, HH:mm:ss';

    const tweetTime = moment.unix(tsMillisecond).format(displayFormat);
    const tweetLink = `https://twitter.com/${accountName}/status/${tweetId}`;

    const slackMsg = `[${tweetTime}] ${realName} ngetweet dengan keywordmu, nih: ${tweetLink}`;

    return getAdmins(app.locals.mongoDriver.db)
      .then((dbResponse) => {
        const admins = dbResponse.data.filter(admin => admin.twitter_notify_enabled === 1);

        admins.forEach(admin => {
          botInstance.api.im.open({
            user: admin.user_id,
          }, (err, res) => {
            if (err) {
              winstonError(`Failed to open IM with user ${admin.user_id} with err ${err}`);
            }

            botInstance.say({
              user: admin.user_id,
              channel: res.channel.id,
              text: slackMsg,
            });
          });
        });
      }).catch((err) => winstonError(err));
  });
}

function initTwitterFeatures(app, botInstance, botController) {
  const twitterController = new Twit({
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
    access_token: accessToken,
    access_token_secret: accessTokenSecret,
  });

  // const trackedWords = app.locals.keywords.join(',');
  const trackedWords = app.locals.keywords.join(',');
  const streamObj = {
    wordStream: undefined,
  };

  addTweetEvent(app, streamObj, botInstance, twitterController);

  /**
   * Bot keyword things
   */
  const {
    addkeywords: addkeywordsRegex,
    removekeywords: removekeywordsRegex,
    listkeywords: listkeywordsRegex,
  } = commandRegexes;

  botController.hears([addkeywordsRegex], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message).then(({ keywords, helpText }) => {
      let botMsg = '';

      // If help text is not defined
      if (!helpText) {
        botMsg = `List keywords [${keywords}] berhasil ditambahkan.`;

        app.locals.keywords = app.locals.keywords.concat(keywords.split(','));

        addTweetEvent(app, streamObj, botInstance, twitterController);
      } else {
        botMsg = helpText;
      }

      bot.reply(message, botMsg);
    }).catch((err) => {
      winstonError(err);

      bot.reply(message, err.message);
    });
  });

  botController.hears([removekeywordsRegex], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message).then(({ keywords, helpText }) => {
      let botMsg = '';

      // If help text is not defined
      if (!helpText) {
        const keywordsArray = keywords.split(',');
        const localsKeywords = app.locals.keywords;

        botMsg = `List keywords [${keywords}] berhasil dihapus.`;

        app.locals.keywords = localsKeywords.filter(keyword => !keywordsArray.includes(keyword));

        addTweetEvent(app, streamObj, botInstance, twitterController);
      } else {
        botMsg = helpText;
      }

      bot.reply(message, botMsg);
    }).catch((err) => {
      winstonError(err);

      bot.reply(message, err.message);
    });
  });

  botController.hears([listkeywordsRegex], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message).then(({ keywords, helpText }) => {
      let botMsg;

      // If help text is not defined
      if (!helpText) {
        botMsg = `Daftar keyword-keyword yang ditrack saat ini:\n`;

        keywords.forEach((keyword, i) => {
          botMsg += `\t${i + 1}. ${keyword}\n`;
        });
      } else {
        botMsg = helpText;
      }

      bot.reply(message, botMsg);
    }).catch((err) => {
      winstonError(err);

      bot.reply(message, err.message);
    });
  });
}

module.exports = initTwitterFeatures;
