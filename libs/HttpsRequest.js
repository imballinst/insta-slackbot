const https = require('https');

const LogUtil = require('../libs/LogUtil');

function httpsRequest(options, data, callback) {
  const req = https.request(options, (res) => {
    LogUtil.winston.log('info', `STATUS: ${res.statusCode}`);
    LogUtil.winston.log('info', `HEADERS: ${res.headers}`);

    // Set response encoding
    res.setEncoding('utf8');

    // On response send data
    let allData = '';
    res.on('data', (chunk) => {
      // LogUtil.winston.log('info', `BODY: ${chunk}`);

      allData += chunk;
    });

    // On response end
    res.on('end', () => {
      if (typeof callback === 'function') {
        callback(allData);
      }

      LogUtil.winston.log('info', 'No more data in response.');
    });
  });

  // On response error
  req.on('error', (e) => {
    LogUtil.winston.log('error', `Problem with request: ${e.message}`);
  });

  // Write data to request body
  if (options.method === 'POST' || options.method === 'PUT') {
    req.write(data);
  }

  req.end();
}

module.exports = httpsRequest;
