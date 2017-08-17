// Import modules
const querystring = require('querystring');

const httpsRequest = require('../libs/HttpsRequest');

// API things
const slackAccessToken = process.env.SLACK_ACCESS_TOKEN;

function getListUsers() {
  // JSON Object of POST data
  const getListUsersJSON = {
    token: slackAccessToken,
  };

  // Stringify JSON and set header options
  const getListUsersString = querystring.stringify(getListUsersJSON);
  const options = {
    hostname: 'slack.com',
    path: `/api/users.list?${getListUsersString}`,
    method: 'GET',
  };

  // Send request
  return httpsRequest(options, getListUsersString);
}

function getListChannels() {
  // JSON Object of POST data
  const getListChannelsJSON = {
    token: slackAccessToken,
  };

  // Stringify JSON and set header options
  const getListChannelsString = querystring.stringify(getListChannelsJSON);
  const options = {
    hostname: 'slack.com',
    path: `/api/channels.list?${getListChannelsString}`,
    method: 'GET',
  };

  // Send request
  return httpsRequest(options, getListChannelsString);
}

module.exports = {
  getListUsers,
  getListChannels,
};
