// Import modules
const querystring = require('querystring');

const app = require('../app');
const httpsRequest = require('../libs/HttpsRequest');

// API things
// const clientID = process.env.CLIENT_ID;
// const clientSecret = process.env.CLIENT_SECRET;
const accessToken = process.env.ACCESS_TOKEN;
const slackToken = process.env.SLACK_VERIFICATION_TOKEN;

app.post('/self', (req, res) => {
  const requestToken = req.body.token;

  if (requestToken === slackToken) {
    // JSON Object of POST data
    const getSelfJSON = {
      access_token: accessToken,
    };

    // Stringify JSON and set header options
    const getSelfString = querystring.stringify(getSelfJSON);
    const options = {
      hostname: 'api.instagram.com',
      path: `/v1/users/self?${getSelfString}`,
      method: 'GET',
    };

    const callback = (json) => {
      res.send(JSON.stringify(json));
    };

    // Send request
    httpsRequest(options, undefined, callback);
  } else {
    res.send('Token doesn\'t match!');
  }
});

app.get('/media/:mediaID', (req, res) => {
  // JSON Object of POST data
  const getMediaJSON = {
    access_token: accessToken,
  };

  // Stringify JSON and set header options
  const getMediaString = querystring.stringify(getMediaJSON);
  const options = {
    hostname: 'api.instagram.com',
    path: `/v1/media/${req.params.mediaID}?${getMediaString}`,
    method: 'GET',
  };

  const callback = (json) => {
    res.send(json);
  };

  // Send request
  httpsRequest(options, undefined, callback);
});
