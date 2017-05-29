// Import modules
const querystring = require('querystring');

const app = require('../app');
const httpsRequest = require('../libs/HttpsRequest');

// API things
// const clientID = process.env.CLIENT_ID;
// const clientSecret = process.env.CLIENT_SECRET;
// const accessToken = process.env.ACCESS_TOKEN;
const slackToken = process.env.SLACK_VERIFICATION_TOKEN;

app.get('/public-channels', (_, res) => {
  // JSON Object of POST data
  const getSelfJSON = {
    token: slackToken,
  };

  // Stringify JSON and set header options
  const getSelfString = querystring.stringify(getSelfJSON);
  const options = {
    hostname: 'slack.com',
    path: `/api/channels.list?${getSelfString}`,
    method: 'GET',
  };

  const callback = (json) => {
    res.send(json);
  };

  // Send request
  httpsRequest(options, getSelfString, callback);
});
