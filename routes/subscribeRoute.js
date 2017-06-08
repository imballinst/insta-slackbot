// Import modules
const querystring = require('querystring');

const app = require('../app');
const httpsRequest = require('../libs/HttpsRequest');

// API things
const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const clientAccessToken = process.env.ACCESS_TOKEN;

const serverUrl = process.env.SERVER_URL;

// Create and Accept Subscription
app.get('/create-sub', (_, res) => {
  // JSON Object of POST data
  const subscribeJSON = {
    client_id: clientID,
    client_secret: clientSecret,
    object: 'user',
    aspect: 'media',
    verify_token: 'myVerifyToken',
    callback_url: `${serverUrl}/callback-sub`,
  };

  // Stringify JSON and set header options
  const subscribeString = querystring.stringify(subscribeJSON);
  const options = {
    hostname: 'api.instagram.com',
    path: '/v1/subscriptions/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(subscribeString),
    },
  };

  const callback = (json) => {
    res.send(json);
  };

  // Send request
  httpsRequest(options, subscribeString, callback);
});

// Callback URL
app.get('/callback-sub', (req, res) => {
  // Send response just the hub.challenge query parameter
  res.send(req.query['hub.challenge']);
});

// List Subscription
app.get('/list-sub', (req, res) => {
  // JSON Object of POST data
  const listSubJSON = {
    client_id: clientID,
    client_secret: clientSecret,
    access_token: clientAccessToken,
  };

  const listSubString = querystring.stringify(listSubJSON);
  const options = {
    hostname: 'api.instagram.com',
    path: `/v1/subscriptions?${listSubString}`,
    method: 'GET',
  };

  const callback = (json) => {
    res.send(json);
  };

  httpsRequest(options, undefined, callback);
});
