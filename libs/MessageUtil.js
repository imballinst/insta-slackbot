const moment = require('moment');

const { getMedias } = require('./InstagramDriver');
const { getMediasByTimerange } = require('./MongoQueries');

const commandHelps = {
  review: 'review help!',
};

const queries = [
  {
    param: 'from',
    prop: 'startDate',
    shorthand: 'f',
  },
  {
    param: 'to',
    prop: 'endDate',
    shorthand: 't',
  },
  {
    param: 'sort',
    prop: 'sort',
    shorthand: 's',
  },
  {
    param: 'user',
    prop: 'user',
    shorthand: 'u',
  },
  {
    param: 'channel',
    prop: 'channel',
    shorthand: 'c',
  },
];

// Helper functions
const isDateValid = string => moment(string, 'DD-MM-YYYY').isValid();
const formatDatetime = momentObject => momentObject.format('dddd, Do MMMM YYYY');

const parseMessage = (message) => {
  // Variables
  const [command, ...args] = message.text.split(' ');
  const commandString = command.replace(/[!]+/g, '');

  const parsedObject = { command: commandString };

  // Classify message based on its arguments
  const argumentLength = args.length;

  if (args.includes('--help')) {
    parsedObject.type = 'help';
  } else if (argumentLength % 2 === 0) {
    parsedObject.type = 'query';
    parsedObject.queries = {};

    const argsLength = args.length;
    let valid = true;
    let i = 0;

    while (valid && i < argsLength) {
      const key = args[i].replace(/[-]+/g, '');
      const queryIndex = queries.findIndex(q => q.param === key || q.shorthand === key);

      if (queryIndex !== -1) {
        // For immutability
        parsedObject.queries[queries[queryIndex].prop] = args[i + 1];
      } else {
        // If there is undefined query, set valid to false and reset the array
        valid = false;

        parsedObject.type = 'invalid';
        parsedObject.queries = {};
      }

      i += 2;
    }
  } else {
    parsedObject.type = 'invalid';
  }

  return parsedObject;
};

const setParamsFromMessage = (parsedObject) => {
  // Set default if not defined to start of and end of week
  const defaultStartDate = moment()
    .hour(0)
    .minute(0)
    .second(0)
    .startOf('week')
    .format('DD-MM-YYYY');
  const defaultEndDate = moment()
    .hour(0)
    .minute(0)
    .second(0)
    .endOf('week')
    .format('DD-MM-YYYY');

  const {
    startDate = defaultStartDate,
    endDate = defaultEndDate,
    sort,
  } = parsedObject;

  return { startDate, endDate, sort };
};

const processMessage = (bot, db, message, onSuccessMeta) => {
  const parsedMessage = parseMessage(message);

  switch (parsedMessage.type) {
    case 'invalid': {
      bot.reply(message, 'Perintah tidak valid. Cek kembali masukan perintah Anda!');

      break;
    }
    case 'help': {
      bot.reply(message, commandHelps[parsedMessage.command]);

      break;
    }
    case 'query': {
      const params = setParamsFromMessage(parsedMessage.queries);

      if (isDateValid(params.startDate) && isDateValid(params.endDate)) {
        // db callback
        const dbCallback = (dbResponse) => {
          const { success, data } = dbResponse;
          const {
            minID = undefined,
            count = 0,
          } = data;

          if (success) {
            // http callback
            const httpCallback = (response) => {
              const { data: posts, meta } = JSON.parse(response);

              if (meta.code === 200) {
                // Success fetching from API
                onSuccessMeta(posts, params);
              } else if (meta.code === 429) {
                // Rate limit reached
                bot.reply(message, 'Limit query tercapai. Silahkan tunggu beberapa saat lagi.');
              }
            };

            getMedias(minID, undefined, count, httpCallback);
          }
        };

        getMediasByTimerange(db, params, dbCallback);
      } else {
        bot.reply(message, 'Tanggal input tidak valid!');
      }

      break;
    }
    default: break;
  }
};

module.exports = {
  commandHelps,
  isDateValid,
  parseMessage,
  setParamsFromMessage,
  processMessage,
  formatDatetime,
};
