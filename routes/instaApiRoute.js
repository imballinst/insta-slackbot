// Import modules
const app = require('../app');
const InstagramQueries = require('../libs/InstagramQueries');

// Destructure functions
const getMediaById = InstagramQueries.getMediaById;
const getSelfProfile = InstagramQueries.getSelfProfile;

// API things
const slackVerificationToken = process.env.SLACK_MESSAGE_VERIFICATION_TOKEN;

app.post('/self', (req, res) => {
  const requestToken = req.body.token;

  if (requestToken === slackVerificationToken) {
    getSelfProfile()
      .then((response) => {
        res.send(JSON.stringify(response));
      });
  } else {
    res.send('Token doesn\'t match!');
  }
});

app.get('/media/:mediaID', (req, res) => {
  getMediaById(req.params.mediaID)
    .then((response) => {
      res.send(JSON.stringify(response));
    });
});
