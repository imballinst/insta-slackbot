const moment = require('moment');

// Import variables
const { specificHelpTexts } = require('./constants/HelpTexts');
const validDateFormats = require('./constants/ValidVariables');
const {
  mediaCommandsList,
  adminCommandsList,
  commands,
} = require('./constants/Commands');

// Import functions
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

// Helper functions
const isDateValid = string => moment(string, validDateFormats).isValid();
const formatDatetime = string => moment(string, validDateFormats).format('dddd, Do MMMM YYYY');

const parseMessage = (message) => {
  // Variables
  const matchingCommand = commands.find(command => command.regex.test(message.match));
  const command = matchingCommand.key;
  const queries = {};
  let type;
  console.log(matchingCommand);
  if (matchingCommand && !message.text.includes('bantuan')) {
    // Delete command text
    const deletedCommandText = new RegExp(`${message.match}(\\s)*`, 'gi');
    const commandParams = matchingCommand.params;
    let remainingMsgText = message.text.replace(deletedCommandText, '');

    // Iterate parameters
    Object.keys(commandParams).forEach((param) => {
      if (remainingMsgText !== '') {
        const regexMatch = commandParams[param][Symbol.match](remainingMsgText);

        if (regexMatch) {
          const matchingParam = regexMatch[0];
          console.log(matchingParam);
          const deletedParams = new RegExp(`${matchingParam}(\\s)*`, 'gi');

          remainingMsgText = remainingMsgText.replace(deletedParams, '');

          if (param === 'sort') {
            const sortParams = matchingParam.split(' ', 3);
            const sortField = sortParams[1];
            const sortOrder = sortParams[2] === 'mengecil' ? 'desc' : 'asc';

            queries[param] = `${sortField}:${sortOrder}`;
          } else {
            queries[param] = matchingParam.split(' ', 2)[1];
          }
        } else {
          throw new Error('Parameter perintah kurang atau salah.');
        }
      }
    });

    type = 'query';
  } else if (matchingCommand && message.text.includes('bantuan')) {
    type = 'help';
  } else {
    type = 'invalid';
  }

  return { command, type, queries };
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
    const startDateFormat = formatDatetime(params.startDate);
    const endDateFormat = formatDatetime(params.endDate);

    if (success && count > 0) {
      // Get all medias except maxID
      return getMedias(minID, maxID, count).then(([promiseArray1, promiseArray2]) => {
        const { data: posts1, meta: meta1 } = JSON.parse(promiseArray1);
        const { data: posts2, meta: meta2 } = JSON.parse(promiseArray2);

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

          if (filteredChannels.length) {
            return { channels: filteredChannels };
          }
          throw new Error('Tidak ada channel yang terdaftar sebagai channel broadcast.');
        }

        throw new Error('Gagal fetch dari database. Silahkan coba lagi.');
      });

      break;
    }
    case 'activate':
    case 'deactivate': {
      let channelName = queries.channel;

      const channelsPromise = new Promise((resolve, reject) => {
        if (channelName) {
          const broadcastStatus = command === 'activate' ? 1 : 0;

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

const processMessage = (db, message) => getAdminById(db, message.user)
  .then((response) => {
    if (response.data.length) {
      let returnedObject;

      const { command, type, queries } = parseMessage(message);

      switch (type) {
        case 'invalid': {
          throw new Error('Perintah tidak valid. Cek kembali masukan perintah Anda!');
        }
        case 'help': {
          console.log(specificHelpTexts[command]);
          if (specificHelpTexts[command] !== '') {
            returnedObject = { helpText: specificHelpTexts[command] };
          } else {
            throw new Error(`Perintah ${message.match} tidak memerlukan bantuan!'`);
          }

          break;
        }
        case 'query': {
          if (mediaCommandsList.includes(command)) {
            returnedObject = runMediaCommand(db, queries);
          } else if (adminCommandsList.includes(command)) {
            returnedObject = runAdministrationCommand(db, command, message, queries);
          } else {
            throw new Error('Perintah tidak teridentifikasi.');
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
  formatDatetime,
  getMediaQueryParams,
  isDateValid,
  parseMessage,
  processMessage,
};
