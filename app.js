// Import modules
const express = require('express');
const bodyParser = require('body-parser');

// Instantiate imported modules
const app = express();

// Middlewares
app.use(express.static('public'));
app.use(bodyParser.json()); // for parsing application/json

// Error handlers

// Export app
module.exports = app;
