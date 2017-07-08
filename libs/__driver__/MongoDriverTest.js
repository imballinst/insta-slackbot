require('dotenv').config();

const LogUtil = require('../LogUtil');
const MongoDriver = require('../MongoDriver');
const { getAdmins, setAdmin, getMediasByTimerange } = require('../MongoQueries');

function openConnectionCallback(db) {
  getAdmins(db, () => {
    setAdmin(db, 'U1Y4059UM', '1', (dbResponse) => {
      console.log(dbResponse);

      getMediasByTimerange(db, {
        startDate: '01-04-2017',
        endDate: '01-07-2017',
      }, (dbResponse2) => {
        console.log(dbResponse2);

        MongoDriver.closeDBConnection();
      });
      // getAdmins(db, (dbResponse2) => {
      //   console.log(dbResponse2);

      //   MongoDriver.closeDBConnection();
      // });
    });
  });
};

MongoDriver.openDBConnection(openConnectionCallback);
