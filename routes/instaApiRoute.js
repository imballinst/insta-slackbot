// Import modules
const app = require('../app');
const InstagramDriver = require('../libs/InstagramDriver');

// Destructure functions
const getMediaById = InstagramDriver.getMediaById;
const getSelfProfile = InstagramDriver.getSelfProfile;

// API things
const slackVerificationToken = process.env.SLACK_MESSAGE_VERIFICATION_TOKEN;

app.post('/self', (req, res) => {
  const requestToken = req.body.token;

  if (requestToken === slackVerificationToken) {
    const callback = (json) => {
      res.send(JSON.stringify(json));
    };

    getSelfProfile(callback);
  } else {
    res.send('Token doesn\'t match!');
  }
});

app.get('/media/:mediaID', (req, res) => {
  const callback = (json) => {
    res.send(json);
  };

  getMediaById(req.params.mediaID, callback);
});
