const http = require('http');

const LogUtil = require('../libs/LogUtil');

function httpRequest(options, data, callback) {
  const req = http.request(options, (res) => {
    LogUtil.winston.log('info', `STATUS: ${res.statusCode}`);
    LogUtil.winston.log('info', `HEADERS: ${res.headers}`);

    // Set response encoding
    res.setEncoding('utf8');

    // On response send data
    res.on('data', (chunk) => {
      LogUtil.winston.log('info', `BODY: ${chunk}`);

      if (typeof callback === 'function') {
        callback(chunk);
      }
    });

    // On response end
    res.on('end', () => {
      LogUtil.winston.log('info', 'No more data in response.');
    });
  });

  // On response error
  req.on('error', (e) => {
    LogUtil.winston.log('error', `Problem with request: ${e.message}`);
  });

  // Write data to request body
  req.write(data);
  req.end();
}

module.exports = httpRequest;
