// Import modules
const app = require('../app');
const LogUtil = require('../libs/LogUtil');

const httpRequest = require('../libs/HttpRequest');

// API things
const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

// Routes
app.get('/', (req, res) => {
  res.send(`Hello World!`);
});

// Create and Accept Subscription
app.get('/create-sub', (req, res) => {
  const subCreateData = {
    client_id: clientID,
    client_secret: clientSecret,
    object: 'user',
    aspect: 'media',
    verify_token: 'myVerifyToken',
    callback_url: 'instagram.imballinst.com/sub-accept',
  };

  const options = {
    hostname: 'api.instagram.com',
    path: '/v1/subscriptions/',
    method: 'POST',
  };

  httpRequest(options, subCreateData);
});

app.get('/sub-accept', (req, res) => {
  res.send(req.query['hub.challenge']);
});

// List Subscription
app.get('/list-sub', (req, res) => {
  const subListData = {
    client_id: clientID,
    client_secret: clientSecret,
  };

  const options = {
    hostname: 'api.instagram.com',
    path: '/v1/subscriptions/',
    method: 'GET',
  };

  const callback = (json) => {
    res.send(json);
  };

  httpRequest(options, subListData);
});

// 404 Not Found
app.get('*', (req, res) => {
  res.send(`Not found!`);
});

// 500
app.use((err, req, res, next) => {
  LogUtil.winston.log('error', err.stack);

  res.status(500).send('Something broke!');
  next();
});
