// Import modules
const querystring = require('querystring');

const httpsRequest = require('./HttpsRequest');

const instaAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

function getSelfProfile(callback) {
  // JSON Object of POST data
  const getSelfJSON = {
    access_token: instaAccessToken,
  };

  // Stringify JSON and set header options
  const getSelfString = querystring.stringify(getSelfJSON);
  const options = {
    hostname: 'api.instagram.com',
    path: `/v1/users/self?${getSelfString}`,
    method: 'GET',
  };

  // Send request
  httpsRequest(options, undefined, callback);
}

function getMediaById(mediaID, callback) {
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
  httpsRequest(options, undefined, callback);
}

function getMedias(minID, maxID, count, callback) {
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

  // Send request
  httpsRequest(options, undefined, callback);
}

function getFollowers(callback) {
  // JSON Object of POST data
  const getFollowersJSON = {
    access_token: instaAccessToken,
  };

  // Stringify JSON and set header options
  const getFollowersString = querystring.stringify(getFollowersJSON);
  const options = {
    hostname: 'api.instagram.com',
    path: `/v1/users/self/followed-by/?${getFollowersString}`,
    method: 'GET',
  };

  // Send request
  httpsRequest(options, undefined, callback);
}

module.exports = {
  getSelfProfile,
  getMediaById,
  getMedias,
  getFollowers,
};
