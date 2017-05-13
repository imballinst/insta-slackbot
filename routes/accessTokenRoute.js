// Import modules
const querystring = require('querystring');

const app = require('../app');
const httpsRequest = require('../libs/HttpsRequest');

// API things
const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

// First step to authorize, redirect to Instagram's redirect URI
app.get('/authorize', (_, res) => {
  // JSON Object of POST data
  const getCodeJSON = {
    client_id: clientID,
    redirect_uri: 'http://instagram.imballinst.com/get-response-code',
    response_type: 'code',
  };

  // Stringify JSON and set header options
  const getCodeString = querystring.stringify(getCodeJSON);

  // Build up the complete path
  const getCodeURL = `https://api.instagram.com/oauth/authorize/?${getCodeString}`;

  res.redirect(getCodeURL);
});

// Second step to authorize, get response code
app.get('/get-response-code', (req, res) => {
  if (req.query.code !== undefined) {
    // JSON Object of POST data
    const getTokenJSON = {
      client_id: clientID,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: 'http://instagram.imballinst.com/get-oauth-token',
      code: req.query.code,
    };

    // Stringify JSON and set header options
    const getTokenString = querystring.stringify(getTokenJSON);
    const options = {
      hostname: 'api.instagram.com',
      path: '/oauth/access_token/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(getTokenString),
      },
    };

    const callback = (json) => {
      res.send(json);
    };

    // Send request
    httpsRequest(options, getTokenString, callback);
  } else {
    res.send(req.query);
  }
});

// Last step to authorize, get the token
app.get('/get-oauth-token', (req, res) => {
  res.send(req.query);
});
