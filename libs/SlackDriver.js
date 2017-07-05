// Import modules
const querystring = require('querystring');

const httpsRequest = require('../libs/HttpsRequest');

// API things
const slackAccessToken = process.env.SLACK_ACCESS_TOKEN;

function getListUsers(callback) {
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
  httpsRequest(options, getListUsersString, (response) => {
    callback(response);
  });
}

module.exports = {
  getListUsers,
};
