const moment = require('moment');

const { getMedias } = require('./InstagramQueries');
const {
  getListUsers,
  getListChannels,
} = require('./SlackQueries');
const {
  getMediasByTimerange,
  getAdmins,
  getAdminById,
  getChannels,
  setAdmin,
  setBroadcastChannel,
} = require('./MongoQueries');

// Media command help template because it's so common
function helpTemplate(command, help, example) {
  const header = `Panduan perintah *${command}*: \`!${command} [argumen]\`\n`;
  const body = `Daftar argumen yang dapat digunakan:\n ${help}`;
  const exampleText = example !== '' ? `Contoh penggunaan: ${example}\n` : '';

  return header + body + exampleText;
}

// Specific command help
const mediaArgs =
  '\t• `--from`, `-f`: waktu awal dalam format *DD-MM-YYYY*. Contoh: `25-05-2015`. Default: awal minggu ini.\n' +
  '\t• `--to`, `-t`: waktu akhir dalam format *DD-MM-YYYY*. Contoh: `25-05-2016`. Default: akhir minggu ini.\n';
const sortParams = '\t• `--sort`, `-s`: urutan dalam format *field:order*. Contoh: `likes:asc`. Default: `time:asc`\n' +
  '\t\t- *field*: atribut untuk diurutkan, diantaranya `likes`, `comments`, `time`, `tags`.\n' +
  '\t\t- *order*: urutan hasil query, yaitu `asc` (kecil-besar) atau `desc` (besar-kecil).\n';

const moteArgs = '\t• `--user`, `-u`: nama username. Contoh: `try.aji`\n';
const setBroadcastArgs = '\t• `--channel`, `-c` (*wajib*): nama channel atau `~here`. Contoh: `general`. Default: `-`\n' +
  '\t• `--broadcast`, `-b`: status broadcast untuk channel, `on` atau `off`. Contoh: `on`. Default: `on`\n';

// Examples
const cmdExamples = {
  review: '`!review -f 25-05-2015 -t 25-05-2016 -s likes:asc` atau `!review --from 25-05-2015 --to 25-05-2016 --sort likes:asc`\n',
  mostlikes: '`!mostlikes -f 25-05-2015 -t 25-05-2016` atau `!mostlikes --from 25-05-2015 --to 25-05-2016`\n',
  countlikes: '`!countlikes -f 25-05-2015 -t 25-05-2016` atau `!countlikes --from 25-05-2015 --to 25-05-2016`\n',
  help: '',
  admins: '',
  promote: '`!promote -u try.aji` atau `!promote --user try.aji`\n',
  demote: '`!demote -u try.aji` atau `!demote --user try.aji`\n',
  channels: '',
  setbroadcast: '`!setbroadcast -c general -b on` atau `!setbroadcast --channel general --broadcast on`',
};

// Whole help command
const commandHelps = {
  review: helpTemplate('review', mediaArgs + sortParams, cmdExamples.review),
  mostlikes: helpTemplate('mostlikes', mediaArgs, cmdExamples.mostlikes),
  countlikes: helpTemplate('countlikes', mediaArgs, cmdExamples.countlikes),
  help: 'Tidak diperlukan bantuan untuk perintah ini.\n',
  admins: 'Tidak diperlukan bantuan untuk perintah ini.\n',
  promote: helpTemplate('promote', moteArgs, cmdExamples.promote),
  demote: helpTemplate('demote', moteArgs, cmdExamples.demote),
  channels: 'Tidak diperlukan bantuan untuk perintah ini.\n',
  setbroadcast: helpTemplate('setbroadcast', setBroadcastArgs, cmdExamples.setbroadcast),
};

// List of media commands
const mediaCommands = [
  'review', 'mostlikes', 'countlikes',
];

// List of administration commands
const adminCommands = [
  'admins', 'promote', 'demote', 'channels', 'setbroadcast',
];

// List of query parameters
const queryParams = [
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
  {
    param: 'broadcast',
    prop: 'broadcast',
    shorthand: 'b',
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

  if (mediaCommands.includes(commandString) || adminCommands.includes(commandString)) {
    if (args.includes('--help')) {
      // Help message for a command
      parsedObject.type = 'help';
    } else if (argumentLength % 2 === 0) {
      // Arguments are valid
      parsedObject.type = 'query';
      parsedObject.queries = {};

      const argsLength = args.length;
      let valid = true;
      let i = 0;

      while (valid && i < argsLength) {
        const key = args[i].replace(/[-]+/g, '');
        const queryIndex = queryParams.findIndex(q => q.param === key || q.shorthand === key);

        if (queryIndex !== -1) {
          // For immutability
          parsedObject.queries[queryParams[queryIndex].prop] = args[i + 1];
        } else {
          // If there is undefined query, set valid to false and reset the array
          valid = false;

          parsedObject.type = 'invalid';
          parsedObject.queries = {};
        }

        i += 2;
      }
    } else {
      // Invalid argument length
      parsedObject.type = 'invalid';
    }
  } else {
    // Invalid command
    parsedObject.type = 'invalid';
  }

  return parsedObject;
};

const getMediaQueryParams = (parsedObject) => {
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

const runMediaCommand = (db, queries) => {
  const params = getMediaQueryParams(queries);

  const startDateFormat = formatDatetime(params.startDate);
  const endDateFormat = formatDatetime(params.endDate);

  const promise = new Promise((resolve, reject) => {
    if (isDateValid(params.startDate) && isDateValid(params.endDate)) {
      const getMediaFromDb = getMediasByTimerange(db, params);

      resolve(getMediaFromDb);
    } else {
      reject('Tanggal input tidak valid!');
    }
  });

  return promise.then((dbResponse) => {
    const { success, data } = dbResponse;
    const {
      minID = undefined,
      maxID = undefined,
      count = 0,
    } = data;

    if (success && count > 0) {
      // Get all medias except maxID
      return getMedias(minID, maxID, count)
        .then((promiseArray) => {
          const { data: posts1, meta: meta1 } = JSON.parse(promiseArray[0]);
          const { data: posts2, meta: meta2 } = JSON.parse(promiseArray[1]);

          if (meta1.code === 200 && meta2.code === 200) {
            // Success fetching from API
            return {
              posts: posts1.concat(posts2),
              params: {
                startDate: startDateFormat,
                endDate: endDateFormat,
                sort: params.sort,
              },
            };
          } else if (meta1.code === 429 || meta2.code === 429) {
            // Rate limit reached
            throw new Error('Limit query tercapai. Silahkan tunggu beberapa saat lagi.');
          } else {
            throw new Error('Unexpected error.');
          }
        });
    }

    throw new Error(`Tidak ada post dari tanggal ${startDateFormat} hingga ${endDateFormat}.`);
  });
};

const runAdministrationCommand = (db, command, message, queries) => {
  let returnPromise;

  switch (command) {
    case 'admins': {
      const usersPromise = new Promise((resolve, reject) => getListUsers().then((response) => {
        const listUsersResponse = JSON.parse(response);

        if (listUsersResponse.ok) {
          const users = listUsersResponse.members;

          getAdmins(db).then((dbResponse) => {
            resolve({ dbResponse, users });
          });
        } else {
          reject(response.error);
        }
      }));

      returnPromise = usersPromise.then(({ dbResponse, users }) => {
        // If successfully fetch from MongoDB
        if (dbResponse.success) {
          const data = dbResponse.data.map(admin => admin.user_id);
          const filteredUsers = users
            .filter(member => data.includes(member.id))
            .map(member => member.name);

          return { admins: filteredUsers };
        }

        throw new Error('Gagal fetch dari database. Silahkan coba lagi.');
      });

      break;
    }
    case 'promote':
    case 'demote': {
      const usersPromise = new Promise((resolve, reject) => {
        const queryUsername = queries.user;
        const adminStatus = command === 'promote' ? 1 : 0;

        if (queryUsername) {
          return getListUsers().then((response) => {
            const listUsersResponse = JSON.parse(response);

            if (listUsersResponse.ok) {
              const users = listUsersResponse.members;
              const userObject = users.find(user => queryUsername === user.name);

              if (userObject) {
                setAdmin(db, userObject.id, adminStatus).then((dbResponse) => {
                  resolve({ dbResponse, queryUsername });
                });
              } else {
                reject('Username tidak ditemukan. Silahkan coba lagi.');
              }
            } else {
              reject(response.error);
            }
          });
        }

        throw new Error('Argumen tidak lengkap. Silahkan coba lagi.');
      });

      returnPromise = usersPromise.then(({ dbResponse, queryUsername }) => {
        // If successfully set to MongoDB
        const success = dbResponse.success;

        if (success) {
          return { username: queryUsername };
        }

        throw new Error('Gagal memasukkan ke database. Silahkan coba lagi.');
      });

      break;
    }
    case 'channels': {
      const channelsPromise = new Promise((resolve, reject) => {
        getListChannels().then((response) => {
          // If successfully hit Slack API
          const listChannelsResponse = JSON.parse(response);

          if (listChannelsResponse.ok) {
            const channels = listChannelsResponse.channels;

            getChannels(db).then((dbResponse) => {
              resolve({ dbResponse, channels });
            });
          } else {
            reject(response.error);
          }
        });
      });

      returnPromise = channelsPromise.then(({ dbResponse, channels }) => {
        const { success, data } = dbResponse;

        // If successfully fetch from MongoDB
        if (success) {
          const mappedData = data.map(channel => channel.channel_id);
          const filteredChannels = channels
            .filter(channel => mappedData.includes(channel.id))
            .map(channel => channel.name);

          return filteredChannels;
        }

        throw new Error('Gagal fetch dari database. Silahkan coba lagi.');
      });

      break;
    }
    case 'setbroadcast': {
      const broadcast = queries.broadcast;
      let channelName = queries.channel;

      const channelsPromise = new Promise((resolve, reject) => {
        if (channelName) {
          const broadcastStatus = broadcast === 'off' ? 0 : 1;

          getListChannels().then((apiResponse) => {
            resolve({
              apiResponse,
              broadcastStatus,
            });
          });
        } else {
          reject('Argumen tidak lengkap. Silahkan coba lagi.');
        }
      });

      returnPromise = channelsPromise.then(({ apiResponse, broadcastStatus }) => {
        // If successfully hit Slack API
        const listChannelsResponse = JSON.parse(apiResponse);

        if (listChannelsResponse.ok) {
          // If API doesn't return error
          let channelID;

          if (channelName === '~here') {
            channelID = message.channel;
            channelName = '[ini]';
          } else {
            const channels = listChannelsResponse.channels;
            channelID = channels.find(channel => channelName === channel.name).id;
          }

          if (channelID) {
            return setBroadcastChannel(db, channelID, broadcastStatus).then((dbResponse) => {
              // If successfully set to MongoDB
              const success = dbResponse.success;

              if (success) {
                return {
                  channelName,
                  broadcastStatus,
                };
              }

              throw new Error('Gagal memasukkan ke database. Silahkan coba lagi.');
            });
          }
          throw new Error('Channel tidak ditemukan. Pastikan channel tersebut public.');
        } else {
          throw new Error(listChannelsResponse.error);
        }
      });

      break;
    }
    default: break;
  }

  return returnPromise;
};

const processMessage = (bot, db, message) => getAdminById(db, message.user)
  .then((response) => {
    if (response.data.length) {
      let returnedObject;

      const { command, type, queries } = parseMessage(message);

      switch (type) {
        case 'invalid': {
          throw new Error('Perintah tidak valid. Cek kembali masukan perintah Anda!');
        }
        case 'help': {
          returnedObject = {
            success: true,
            data: {
              message: commandHelps[command],
            },
          };

          break;
        }
        case 'query': {
          if (mediaCommands.includes(command)) {
            returnedObject = runMediaCommand(db, queries);
          } else if (adminCommands.includes(command)) {
            returnedObject = runAdministrationCommand(db, command, message, queries);
          } else {
            throw new Error('Perintah tidak teridentifikasi');
          }

          break;
        }
        default: break;
      }

      return returnedObject;
    }
    throw new Error('Anda bukan admin!');
  });

function batchReply(bot, messageObj, posts, currentIndex) {
  setTimeout(() => {
    const length = posts.length;
    const {
      link,
      created_time: date,
      likes,
      caption,
      comments,
      tags,
    } = posts[currentIndex];

    const createdAt = `*${formatDatetime(moment.unix(date))}*`;
    const tagsText = tags.length > 0 ? `*Tags*: _${tags.join(',')}_.\n` : '';
    const captionText = caption !== '' ? `${caption}\n\n` : '';
    const nextIndex = currentIndex + 1;
    let botMsg = '';

    // Manually concat for each post
    botMsg += `${currentIndex + 1}. ${link} (${createdAt}) - *${likes}* likes\n\n`;
    botMsg += `${captionText} ${tagsText} *Comments count*: ${comments}.`;

    bot.reply(messageObj, botMsg, (err) => {
      if (!err) {
        if (nextIndex < length) {
          batchReply(bot, messageObj, posts, nextIndex);
        }
      } else {
        bot.reply(messageObj, err);
      }
    });
  }, 1000);
}

module.exports = {
  batchReply,
  commandHelps,
  formatDatetime,
  getMediaQueryParams,
  isDateValid,
  parseMessage,
  processMessage,
};
