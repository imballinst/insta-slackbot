// Import modules
const fs = require('fs');

function replaceAccessToken(token) {
  fs.readFile('.env', 'utf-8', (readFileErr, data) => {
    if (readFileErr) {
      throw readFileErr;
    }

    const array = data.split('\n');
    const varIndex = array.findIndex(envVar => envVar.includes('INSTAGRAM_ACCESS_TOKEN'));

    // Access token is line #6, therefore it's array #5
    const indexOfEqualSymbol = array[varIndex].indexOf('=');
    const newTokenValue = `${array[varIndex].substr(0, indexOfEqualSymbol)}=${token}`;
    array[varIndex] = newTokenValue;

    // Convert array to string
    const newEnvironmentVariables = array.join('\n');

    fs.writeFile('.env', newEnvironmentVariables, 'utf-8', (writeFileErr) => {
      if (writeFileErr) {
        throw writeFileErr;
      }
    });
  });
}

module.exports = replaceAccessToken;
