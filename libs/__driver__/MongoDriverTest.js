require('dotenv').config();

const LogUtil = require('../LogUtil');
const MongoDriver = require('../MongoDriver');
const { getAdmins, setAdmin } = require('../MongoQueries');

function openConnectionCallback(db) {
  getAdmins(db, () => {
    setAdmin(db, 'U1Y4059UM', '1', (dbResponse) => {
      console.log(dbResponse);

      getAdmins(db, (dbResponse2) => {
        console.log(dbResponse2);

        MongoDriver.closeDBConnection();
      });
    });
  });
};

MongoDriver.openDBConnection(openConnectionCallback);
