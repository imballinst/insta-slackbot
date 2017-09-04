const https = require('https');
const Promise = require('bluebird');

const winstonInfo = require('../libs/LogUtil').winstonInfo;

function httpsRequest(options, data) {
  const requestPromise = new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      winstonInfo(`STATUS: ${res.statusCode}`);
      winstonInfo(`HEADERS: ${res.headers}`);

      // Set response encoding
      res.setEncoding('utf8');

      // On response send data
      let allData = '';
      res.on('data', (chunk) => {
        allData += chunk;
      });

      // On response end
      res.on('end', () => {
        winstonInfo('No more data in response.');

        resolve(allData);
      });
    });

    // Write data to request body
    if (options.method === 'POST' || options.method === 'PUT') {
      req.write(data);
    }

    // On response error
    req.on('error', e => reject(e));
    req.end();
  });

  return requestPromise;
}

module.exports = httpsRequest;
