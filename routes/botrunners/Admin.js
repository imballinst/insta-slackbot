const { events, commandRegexes } = require('../../libs/constants/Commands');
const { generalHelpText } = require('../../libs/constants/HelpTexts');
const { broadcastMessages } = require('../../libs/constants/CommonVariables');

const { winstonInfo, winstonError } = require('../../libs/LogUtil');
const { getMediaById } = require('../../libs/InstagramQueries');
const { getChannels } = require('../../libs/MongoQueries');
const { processMessage, batchReply } = require('../../libs/MessageUtil');

function initAdminFeatures(app, botController) {
  // List command regexes
  const {
    help: helpRegex,
    admins: adminsRegex,
    channels: channelsRegex,
    promote: promoteRegex,
    demote: demoteRegex,
    activate: activateRegex,
    deactivate: deactivateRegex,
    notify: notifyRegex,
    denotify: denotifyRegex,
  } = commandRegexes;

  /**
   * Help
   */
  botController.hears([helpRegex], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    bot.reply(message, generalHelpText);
  });

  /**
   * Admins
   */
  botController.hears([adminsRegex], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message).then(({ admins, helpText }) => {
      let botMsg = '';

      // If help text is not defined
      if (!helpText) {
        const length = admins.length;

        botMsg = 'List admin-admin yang terdaftar:\n';

        // iterate to botMsg
        admins.forEach((admin, i) => {
          const { name, isNotifyEnabled } = admin;
          const textName = isNotifyEnabled === 1 ? `*${name}*` : name;

          // Manually concat for each post
          botMsg += `\t${i + 1}. ${textName}`;

          // Add newline if it is not the last element
          botMsg += (i + 1 < length) ? '\n' : '\n\n';
        });

        botMsg += '*Keterangan*: admin yang dicetak tebal adalah yang dinotifikasi apabila ' +
          '_keyword_ yang telah ditentukan muncul dari tweet seseorang di Twitter.'
      } else {
        botMsg = helpText;
      }

      bot.reply(message, botMsg);
    }).catch((err) => {
      winstonError(err);

      bot.reply(message, err);
    });
  });

  botController.hears([promoteRegex], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message).then(({ username, helpText }) => {
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

  botController.hears([demoteRegex], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message).then(({ username, helpText }) => {
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

  botController.hears([notifyRegex], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message).then(({ username, helpText }) => {
      let botMsg;

      // If help text is not defined
      if (!helpText) {
        botMsg = `Sukses menyalakan notifikasi keyword Twitter untuk ${username}!`;
      } else {
        botMsg = helpText;
      }

      bot.reply(message, botMsg);
    }).catch((err) => {
      winstonError(err);

      bot.reply(message, err);
    });
  });

  botController.hears([denotifyRegex], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message).then(({ username, helpText }) => {
      let botMsg;

      // If help text is not defined
      if (!helpText) {
        botMsg = `Sukses mematikan notifikasi keyword Twitter untuk ${username}!`;
      } else {
        botMsg = helpText;
      }

      bot.reply(message, botMsg);
    }).catch((err) => {
      winstonError(err);

      bot.reply(message, err);
    });
  });

  /**
   * Channels
   */
  botController.hears([channelsRegex], events, (bot, message) => {
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

  botController.hears([activateRegex], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message).then(({ channelName, helpText }) => {
      let botMsg;

      // If help text is not defined
      if (!helpText) {
        botMsg = `Sukses menjadikan channel ${channelName} menjadi channel broadcast!`;
      } else {
        botMsg = helpText;
      }

      bot.reply(message, botMsg);
    }).catch((err) => {
      winstonError(err);

      bot.reply(message, err);
    });
  });

  botController.hears([deactivateRegex], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message).then(({ channelName, helpText }) => {
      let botMsg;

      // If help text is not defined
      if (!helpText) {
        botMsg = `Sukses menjadikan channel ${channelName} menjadi channel biasa!`;
      } else {
        botMsg = helpText;
      }

      bot.reply(message, botMsg);
    }).catch((err) => {
      winstonError(err);

      bot.reply(message, err);
    });
  });
}

module.exports = initAdminFeatures;
