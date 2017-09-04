// Import modules
const querystring = require('querystring');

const app = require('../app');
const httpsRequest = require('../libs/HttpsRequest');
const replaceAccessToken = require('../libs/ReplaceAccessToken');
const { winstonInfo, winstonError } = require('../libs/LogUtil');

// API things
const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const changeTokenPassword = process.env.SECURE_CHANGE_KEY;
const serverUrl = process.env.SERVER_URL;

// First step to authorize, redirect to Instagram's redirect URI
app.get('/authorize', (_, res) => {
  res.render('index');
});

app.post('/authorize', (req, res) => {
  const password = req.body.password;

  if (password === changeTokenPassword) {
    // JSON Object of POST data
    const getCodeJSON = {
      client_id: clientID,
      scope: 'basic follower_list',
      redirect_uri: `${serverUrl}/get-response-code`,
      response_type: 'code',
    };

    // Stringify JSON and set header options
    const getCodeString = querystring.stringify(getCodeJSON);

    // Build up the complete path
    const getCodeURL = `https://api.instagram.com/oauth/authorize/?${getCodeString}`;

    res.redirect(getCodeURL);
  } else {
    winstonError(`Authorization failed with password ${password}!`);
  }
});

// Second step to authorize, get response code
app.get('/get-response-code', (req, res) => {
  if (req.query.code !== undefined) {
    // JSON Object of POST data
    const getTokenJSON = {
      client_id: clientID,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: `${serverUrl}/get-response-code`,
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

    // Send request
    httpsRequest(options, getTokenString)
      .then((response) => {
        const accessToken = JSON.parse(response).access_token;

        replaceAccessToken(accessToken);

        res.send('Authorization and access token change successful!');

        winstonInfo(`Access token changed to ${accessToken}`);
      });
  } else {
    res.send(req.query);
  }
});
