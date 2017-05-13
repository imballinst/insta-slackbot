// Import modules
const app = require('../app');

// Index route
app.get('/', (req, res) => {
  res.send('Hello World!');
});
