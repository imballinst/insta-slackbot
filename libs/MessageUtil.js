import moment from 'moment';

// Command and query dictionary
const commands = [
  'admins', 'promote', 'demote', 'channels', 'setchannel', 'help',
  'review', 'mostlikes', 'count', 'followers',
];

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
  const [command, ...args] = message.split(' ');
  const commandString = command.replace(/[!]+/g, '');

  const parsedObject = {};

  // Set object properties
  parsedObject.command = commandString;

  // Classify message based on its arguments
  const argumentLength = args.length;

  if (argumentLength === 0 || argumentLength % 2 !== 0 || !commands.includes(commandString)) {
    parsedObject.type = 'invalid';
  } else if (args.includes('--help')) {
    parsedObject.type = 'help';
  } else {
    parsedObject.type = 'query';
    parsedObject.queries = {};

    // Think about something that could easily parse based on commands
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

export {
  isDateValid,
  parseMessage,
  setParamsFromMessage,
  formatDatetime,
};
