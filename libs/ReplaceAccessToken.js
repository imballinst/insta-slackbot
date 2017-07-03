// Import modules
const fs = require('fs');

function replaceAccessToken(token) {
  fs.readFile('.env', 'utf-8', (readFileErr, data) => {
    if (readFileErr) {
      throw readFileErr;
    }

    const arrayOfEnvVariables = data.split('\n');

    // Access token is line #6, therefore it's array #5
    const indexOfEqualSymbol = arrayOfEnvVariables[5].indexOf('=');
    const newTokenValue = `${arrayOfEnvVariables[5].substr(0, indexOfEqualSymbol)}=${token}`;
    arrayOfEnvVariables[5] = newTokenValue;

    // Convert array to string
    const newEnvironmentVariables = arrayOfEnvVariables.join('\n');

    fs.writeFile('.env', newEnvironmentVariables, 'utf-8', (writeFileErr) => {
      if (writeFileErr) {
        throw writeFileErr;
      }
    });
  });
}

module.exports = replaceAccessToken;
