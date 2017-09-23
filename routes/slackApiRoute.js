// Import modules
const querystring = require('querystring');

const httpsRequest = require('../libs/HttpsRequest');

// API things
const slackAccessToken = process.env.SLACK_ACCESS_TOKEN;

function initSlackApiRoute(app) {
  app.get('/list-channels', (_, res) => {
    // JSON Object of POST data
    const getSelfJSON = {
      token: slackAccessToken,
      exclude_members: true,
      exclude_archived: true,
    };

    // Stringify JSON and set header options
    const getSelfString = querystring.stringify(getSelfJSON);
    const options = {
      hostname: 'slack.com',
      path: `/api/channels.list?${getSelfString}`,
      method: 'GET',
    };

    // Send request
    httpsRequest(options, getSelfString)
      .then((response) => {
        res.send(response);
      });
  });

  app.get('/list-users', (_, res) => {
    // JSON Object of POST data
    const getSelfJSON = {
      token: slackAccessToken,
    };

    // Stringify JSON and set header options
    const getSelfString = querystring.stringify(getSelfJSON);
    const options = {
      hostname: 'slack.com',
      path: `/api/users.list?${getSelfString}`,
      method: 'GET',
    };

    // Send request
    httpsRequest(options, getSelfString)
      .then((response) => {
        res.send(response);
      });
  });
}

module.exports = initSlackApiRoute;
