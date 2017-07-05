const moment = require('moment');

const { getMedias } = require('./InstagramDriver');
const {
  getListUsers,
  getListChannels,
} = require('./SlackDriver');
const {
  getMediasByTimerange,
  getAdmins,
  getAdminById,
  getChannels,
  setAdmin,
  setBroadcastChannel,
} = require('./MongoQueries');

// List of command help messages
const commandHelps = {
  review: 'review help!',
  mostlikes: 'mostlikes help!',
  count: 'count help!',
  help: 'help help!',
  admins: 'admins help!',
  promote: 'promote help!',
  demote: 'demote help!',
  channels: 'channels help!',
  setbroadcast: 'setbroadcast help!',
};

// List of media commands
const mediaCommands = [
  'review', 'mostlikes', 'count',
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

const processMessage = (bot, db, message, onSuccess) => {
  const adminCheckCallback = (adminsResponse) => {
    if (adminsResponse.data.length) {
      const { command, type, queries } = parseMessage(message);

      switch (type) {
        case 'invalid': {
          bot.reply(message, 'Perintah tidak valid. Cek kembali masukan perintah Anda!');

          break;
        }
        case 'help': {
          bot.reply(message, commandHelps[command]);

          break;
        }
        case 'query': {
          if (mediaCommands.includes(command)) {
            // If it is a media command
            const params = getMediaQueryParams(queries);

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
                      onSuccess(posts, params);
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
          } else if (adminCommands.includes(command)) {
            // If it is an administration command
            // 'admins', 'promote', 'demote', 'channels', 'setbroadcast',
            switch (command) {
              case 'admins': {
                const httpCallback = (response) => {
                  // If successfully hit Slack API
                  const listUsersResponse = JSON.parse(response);

                  if (listUsersResponse.ok) {
                    const users = listUsersResponse.members;
                    const dbCallback = (dbResponse) => {
                      // If successfully fetch from MongoDB
                      if (dbResponse.success) {
                        const data = dbResponse.data.map(admin => admin.user_id);
                        const filteredUsers = users
                          .filter(member => data.includes(member.id))
                          .map(member => member.name);

                        onSuccess(filteredUsers);
                      } else {
                        bot.reply(
                          message,
                          'Gagal fetch dari database. Silahkan coba lagi.'
                        );
                      }
                    };

                    getAdmins(db, dbCallback);
                  } else {
                    bot.reply(message, response.error);
                  }
                };

                getListUsers(httpCallback);

                break;
              }
              case 'promote':
              case 'demote': {
                const queryUsername = queries.user;
                const adminStatus = command === 'promote' ? '1' : '0';

                if (queryUsername) {
                  const httpCallback = (response) => {
                    // If successfully hit Slack API
                    const listUsersResponse = JSON.parse(response);

                    if (listUsersResponse.ok) {
                      const users = listUsersResponse.members;
                      const userObject = users.find(user => queryUsername === user.name);

                      if (userObject) {
                        const dbCallback = (dbResponse) => {
                          // If successfully fetch from MongoDB
                          const success = dbResponse.success;

                          if (success) {
                            onSuccess(success, queryUsername);
                          } else {
                            bot.reply(
                              message,
                              'Gagal fetch dari database. Silahkan coba lagi.'
                            );
                          }
                        };

                        setAdmin(db, userObject.id, adminStatus, dbCallback);
                      } else {
                        bot.reply(message, 'Username tidak ditemukan. Silahkan coba lagi.');
                      }
                    } else {
                      bot.reply(message, response.error);
                    }
                  };

                  getListUsers(httpCallback);
                } else {
                  bot.reply(message, 'Argumen tidak lengkap. Silahkan coba lagi.');
                }

                break;
              }
              case 'channels': {
                const httpCallback = (response) => {
                  // If successfully hit Slack API
                  const listChannelsResponse = JSON.parse(response);

                  if (listChannelsResponse.ok) {
                    const channels = listChannelsResponse.channels;
                    const dbCallback = (dbResponse) => {
                      // If successfully fetch from MongoDB
                      if (dbResponse.success) {
                        const data = dbResponse.data.map(channel => channel.channel_id);
                        const filteredChannels = channels
                          .filter(channel => data.includes(channel.id))
                          .map(channel => channel.name);

                        onSuccess(filteredChannels);
                      } else {
                        bot.reply(
                          message,
                          'Gagal fetch dari database. Silahkan coba lagi.'
                        );
                      }
                    };

                    getChannels(db, dbCallback);
                  } else {
                    bot.reply(message, response.error);
                  }
                };

                getListChannels(httpCallback);

                break;
              }
              case 'setbroadcast': {
                const broadcast = queries.broadcast;
                let channelName = queries.channel;

                if (channelName) {
                  const broadcastStatus = broadcast === 'off' ? '0' : '1';
                  const httpCallback = (response) => {
                    // If successfully hit Slack API
                    const listChannelsResponse = JSON.parse(response);

                    if (listChannelsResponse.ok) {
                      // If API doesn't return error
                      let channelID = '';

                      if (channelName === '~here') {
                        channelID = message.channel;
                        channelName = 'ini';
                      } else {
                        const channels = listChannelsResponse.channels;
                        channelID = channels.find(channel => channelName === channel.name).id;
                      }

                      if (channelID !== '') {
                        const dbCallback = (dbResponse) => {
                          // If successfully fetch from MongoDB
                          const success = dbResponse.success;

                          if (success) {
                            onSuccess(success, channelName, broadcastStatus);
                          } else {
                            bot.reply(
                              message,
                              'Gagal fetch dari database. Silahkan coba lagi.'
                            );
                          }
                        };

                        setBroadcastChannel(db, channelID, broadcastStatus, dbCallback);
                      } else {
                        bot.reply(message, 'Channel tidak ditemukan. Silahkan coba lagi.');
                      }
                    } else {
                      // If API returns an error
                      bot.reply(message, response.error);
                    }
                  };

                  getListChannels(httpCallback);
                } else {
                  bot.reply(message, 'Argumen tidak lengkap. Silahkan coba lagi.');
                }

                break;
              }
              default: break;
            }
          }

          break;
        }
        default: break;
      }
    } else {
      bot.reply(message, 'Perintah hanya dapat diberikan oleh admin-admin.');
    }
  };

  getAdminById(db, message.user, adminCheckCallback);
};

module.exports = {
  commandHelps,
  isDateValid,
  parseMessage,
  getMediaQueryParams,
  processMessage,
  formatDatetime,
};
