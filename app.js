// Import modules
const express = require('express');
const bodyParser = require('body-parser');

// Instantiate imported modules
const app = express();

// Middlewares
app.use(express.static('public'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ // for parsing URL-encoded bodies
  extended: true,
}));

// View
app.set('view engine', 'ejs');
app.set('views', './views');

// Error handlers

// Export app
module.exports = app;
