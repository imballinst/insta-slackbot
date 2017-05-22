// Import modules
const querystring = require('querystring');

const app = require('../app');
const httpsRequest = require('../libs/HttpsRequest');

// API things
// const clientID = process.env.CLIENT_ID;
// const clientSecret = process.env.CLIENT_SECRET;
const accessToken = process.env.ACCESS_TOKEN;

app.get('/self', (_, res) => {
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
    res.send(json);
  };

  // Send request
  httpsRequest(options, getSelfString, callback);
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
  httpsRequest(options, getMediaString, callback);
});
