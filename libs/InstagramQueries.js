// Import modules
const querystring = require('querystring');

const httpsRequest = require('./HttpsRequest');
const Promise = require('bluebird');

const instaAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

function getMediaById(mediaID) {
  // JSON Object of POST data
  const getMediaJSON = {
    access_token: instaAccessToken,
  };

  // Stringify JSON and set header options
  const getMediaString = querystring.stringify(getMediaJSON);
  const options = {
    hostname: 'api.instagram.com',
    path: `/v1/media/${mediaID}?${getMediaString}`,
    method: 'GET',
  };
  // Send request
  return httpsRequest(options, undefined);
}

function getMedias(minID, maxID, count) {
  // JSON Object of POST data
  const getMediasJSON = {
    access_token: instaAccessToken,
    // includes media with minID
    min_id: minID,
    // excludes media with maxID
    max_id: maxID,
    count,
  };

  // Stringify JSON and set header options
  const getMediasString = querystring.stringify(getMediasJSON);
  const options = {
    hostname: 'api.instagram.com',
    path: `/v1/users/self/media/recent/?${getMediasString}`,
    method: 'GET',
  };

  const medias = count > 1 ?
    httpsRequest(options, undefined) : getMediaById(maxID);
  const mediaMaxID = maxID && count > 1 ?
    getMediaById(maxID) : '{ "data": [], "meta": { "code": 200 }}';

  // Send request
  return Promise.all([
    medias,
    mediaMaxID,
  ]);
}

module.exports = {
  getMediaById,
  getMedias,
};
