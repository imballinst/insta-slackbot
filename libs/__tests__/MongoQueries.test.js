import moment from 'moment';

import {
  insertOne,
  insertMany,
  find,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
  findOneAndUpdate,
  findOneAndReplace,
  findOneAndDelete,
  getMediasByTimerange,
  getAdmins,
  getAdminById,
  getChannels,
  setAdmin,
  setBroadcastChannel,
} from '../MongoQueries';
import MongoDriver from '../MongoDriver';
import { winstonInfo } from '../LogUtil';

let dbPromise;

// Open db connection before tests
beforeAll(() => {
  dbPromise = MongoDriver.openDBConnection();

  return dbPromise;
});

// Close db connection after tests
afterAll(() => {
  return dbPromise.then(db => {
    MongoDriver.closeDBConnection();
  });
});

/**
 * Generic Functions
 */
describe('MongoQueries Generic Components (libs/MongoQueries)', () => {
  /**
   * Pre-tests and post-tests
   */
  beforeAll(() => {
    return dbPromise.then(db => db.createCollection('testCollection1'));
  });

  afterAll(() => {
    return dbPromise.then(db => db.dropCollection('testCollection1'));
  });

  /**
   * Insert document(s)
   */
  it('should insert one to db correctly', () => {
    return dbPromise.then(db => {
      return insertOne(db, 'testCollection1', { a: 'test insert one', b: 1 });
    }).then(dbResponse => {
      const { success, data } = dbResponse;

      expect(success).toBe(true);
      expect(data).toEqual({ n: 1 });
    });
  });

  it('should insert many to db correctly', () => {
    return dbPromise.then(db => {
      return insertMany(db, 'testCollection1', [
        { a: 'test insert many', b: 1 },
        { a: 'test insert many', b: 2 },
        { a: 'test insert many', b: 3 },
        { a: 'test update many 2', b: 1 },
      ]);
    }).then(dbResponse => {
      const { success, data } = dbResponse;

      expect(success).toBe(true);
      expect(data).toEqual({ n: 4 });
    });
  });

  /**
   * Find document(s)
   */
  it('should find document(s) db correctly', () => {
    return dbPromise.then(db => {
      return Promise.all([
        find(db, 'testCollection1', { a: 'test insert one' }),
        find(db, 'testCollection1', { a: 'test insert many' })
      ]);
    }).then((promiseResults) => {
      const { '0': resultFindOne, '1': resultFindMany } = promiseResults;

      const { success: successFindOne, data: dataFindOne } = resultFindOne;
      const { success: successFindMany, data: dataFindMany } = resultFindMany;

      expect(successFindOne).toBe(true);
      expect(dataFindOne.length).toEqual(1);

      expect(successFindMany).toBe(true);
      expect(dataFindMany.length).toEqual(3);
    })
    ;
  });

  /**
   * Update document(s)
   */
  it('should update a document inside the db correctly', () => {
    return dbPromise.then(db => {
      const query = { a: 'test insert one' };
      const update = {
        $set: {
          a: 'test update one',
        },
        $inc: {
          b: 3,
        },
      };
      const opts = undefined;

      return updateOne(db, 'testCollection1', query, update, opts);
    }).then(dbResponse => {
      const { success, data } = dbResponse;

      expect(success).toBe(true);
      expect(data).toEqual({ n: 1, nModified: 1 });
    });
  });

  it('should update documents inside the db correctly', () => {
    return dbPromise.then(db => {
      const query = { a: 'test insert many' };
      const update = {
        $set: {
          a: 'test update many',
        },
        $inc: {
          b: 3,
        },
      };
      const opts = undefined;

      return updateMany(db, 'testCollection1', query, update, opts);
    }).then(dbResponse => {
      const { success, data } = dbResponse;

      expect(success).toBe(true);
      expect(data).toEqual({ n: 3, nModified: 3 });
    });
  });

  /**
   * Delete document(s)
   */
  it('should delete a document inside the db correctly', () => {
    return dbPromise.then(db => {
      const query = { a: 'test update one', b: 4 };

      return deleteOne(db, 'testCollection1', query);
    }).then(dbResponse => {
      const { success, data } = dbResponse;

      expect(success).toBe(true);
      expect(data).toEqual({ n: 1 });
    });
  });

  it('should delete documents inside the db correctly', () => {
    return dbPromise.then(db => {
      const query = { a: 'test update many' };

      return deleteMany(db, 'testCollection1', query);
    }).then(dbResponse => {
      const { success, data } = dbResponse;

      expect(success).toBe(true);
      expect(data).toEqual({ n: 3 });
    });
  });

  /**
   * Find document(s) combination
   */
  it('should find and update a document inside the db correctly', () => {
    return dbPromise.then(db => {
      const query = { a: 'test update many 2', b: 1 };
      const update = {
        $set: {
          b: 5,
        },
      };
      const options = {
        upsert: true,
      };

      return findOneAndUpdate(db, 'testCollection1', query, update, options);
    }).then(dbResponse => {
      const { success, data } = dbResponse;

      expect(success).toBe(true);
      expect(data.value.a).toBe('test update many 2');
      expect(data.value.b).toBe(1);
    });
  });

  it('should find and replace a document inside the db correctly', () => {
    return dbPromise.then(db => {
      const query = { a: 'test update many 2', b: 5 };
      const replacement = {
        a: 'test update many 2',
        b: 15,
      };

      return findOneAndReplace(db, 'testCollection1', query, replacement);
    }).then(dbResponse => {
      const { success, data } = dbResponse;

      expect(success).toBe(true);
      expect(data.value.a).toBe('test update many 2');
      expect(data.value.b).toBe(5);
    });
  });

  it('should find and delete a document inside the db correctly', () => {
    return dbPromise.then(db => {
      const query = { a: 'test update many 2', b: 15 };

      return findOneAndDelete(db, 'testCollection1', query);
    }).then(dbResponse => {
      const { success, data } = dbResponse;

      expect(success).toBe(true);
      expect(data.value.a).toBe('test update many 2');
      expect(data.value.b).toBe(15);
    });
  });
});

describe('MongoQueries Specific Components (libs/MongoQueries)', () => {
  /**
   * Pre-tests and post-tests
   */
  beforeAll(() => {
    const insertedMediaMocks = [];
    const insertedAdmins = [];
    const insertedChannels = [];

    for (let i = 0; i < 6; i++) {
      const curIterateTime = moment().subtract(i, 'days').toISOString();
      ;
      insertedMediaMocks.push({ id: i, created_time: new Date(curIterateTime) });
      insertedAdmins.push({ user_id: `admin_${i}`, is_admin: 1 });
      insertedChannels.push({ channel_id: `channel_${i}`, is_broadcast: 1 });
    }

    return Promise.all([
      dbPromise.then(db => insertMany(db, 'postedmedias', insertedMediaMocks)),
      dbPromise.then(db => insertMany(db, 'admins', insertedAdmins)),
      dbPromise.then(db => insertMany(db, 'channels', insertedChannels)),
    ]);
  });

  afterAll(() => {
    return Promise.all([
      dbPromise.then(db => deleteMany(db, 'postedmedias', {})),
      dbPromise.then(db => deleteMany(db, 'admins', {})),
      dbPromise.then(db => deleteMany(db, 'channels', {})),
    ]);
  });

  /**
   * Get tests
   */
  it('should get medias from timerange', () => {
    const timeParams = {
      startDate: moment().subtract(3, 'days').format('DD-MM-YYYY'),
      endDate: moment().format('DD-MM-YYYY'),
    };

    return dbPromise
      .then(db => getMediasByTimerange(db, timeParams))
      .then(dbResponse => {
        const { success, data } = dbResponse;

        expect(success).toBe(true);
        expect(data.minID).toBe(3);
        expect(data.maxID).toBe(1);
        expect(data.count).toBe(3);
      });
  });

  it('should get active admins', () => {
    return dbPromise
      .then(db => getAdmins(db))
      .then(dbResponse => {
        const { success, data } = dbResponse;

        expect(success).toBe(true);
        expect(data.length).toBe(6);
      });
  });

  it('should get admin by id', () => {
    return dbPromise
      .then(db => getAdminById(db, 'admin_3'))
      .then(dbResponse => {
        const { success, data } = dbResponse;
        const { _id, ...restData } = data[0];

        expect(success).toBe(true);
        expect(restData).toEqual({
          user_id: 'admin_3',
          is_admin: 1,
        });
      });
  });

  it('should get active channels', () => {
    return dbPromise
      .then(db => getChannels(db))
      .then(dbResponse => {
        const { success, data } = dbResponse;

        expect(success).toBe(true);
        expect(data.length).toBe(6);
      });
  });

  /**
   * Set tests
   */
  it('should deactivate a channel', () => {
    return dbPromise
      .then(db => {
        setBroadcastChannel(db, 'channel_0', 0)
          .then(dbResponse => {
            expect(dbResponse.success).toBe(true);
          })
          .then(() => {
            getChannels(db)
              .then(dbResponse => {
                const { success, data } = dbResponse;

                expect(success).toBe(true);
                expect(data.length).toBe(5);
              });
          });
      });
  });

  it('should deactivate an admin', () => {
    return dbPromise
      .then(db => {
        setAdmin(db, 'admin_0', 0)
          .then(dbResponse => {
            expect(dbResponse.success).toBe(true);
          })
          .then(() => {
            getAdmins(db)
              .then(dbResponse => {
                const { success, data } = dbResponse;

                expect(success).toBe(true);
                expect(data.length).toBe(5);
              });
          });
      });
  });
});
