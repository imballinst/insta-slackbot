import moment from 'moment';

import validDateFormats from '../constants/ValidVariables';
import {
  formatDatetime,
  getMediaQueryParams,
  isDateValid,
  parseMessage,
} from '../MessageUtil';

// Set moment locale
moment.locale('id');

describe('MessageUtil component, parseMessage (libs/MessageUtil)', () => {
  /**
   * Media commands
   */
  it('should parse review message correctly', () => {
    const message = {
      text: 'review dari 27-07-2017 hingga 28-07-2017 urutkan likes membesar',
      match: 'review',
    };

    const parsedMessage = parseMessage(message);
    const expected = {
      command: 'review',
      type: 'query',
      queries: {
        startDate: '27-07-2017',
        endDate: '28-07-2017',
        sort: 'likes:asc'
      },
    };

    expect(expected).toEqual(parsedMessage);
  });

  it('should parse mostlikes message correctly', () => {
    const message = {
      text: 'likes terbanyak dari 27-07-2017 hingga 28-07-2017',
      match: 'likes terbanyak',
    };

    const parsedMessage = parseMessage(message);
    const expected = {
      command: 'mostlikes',
      type: 'query',
      queries: {
        startDate: '27-07-2017',
        endDate: '28-07-2017',
      },
    };

    expect(expected).toEqual(parsedMessage);
  });

  it('should parse countlikes message correctly', () => {
    const message = {
      text: 'jumlah likes dari 27-07-2017 hingga 28-07-2017',
      match: 'jumlah likes',
    };

    const parsedMessage = parseMessage(message);
    const expected = {
      command: 'countlikes',
      type: 'query',
      queries: {
        startDate: '27-07-2017',
        endDate: '28-07-2017',
      },
    };

    expect(expected).toEqual(parsedMessage);
  });

  /**
   * Administration Commands
   */
  it('should parse help message correctly', () => {
    const message = {
      text: 'bantuan',
      match: 'bantuan',
    };

    const parsedMessage = parseMessage(message);
    const expected = {
      command: 'help',
      type: 'help',
      queries: {},
    };

    expect(expected).toEqual(parsedMessage);
  });

  it('should parse admins message correctly', () => {
    const message = {
      text: 'daftar admins',
      match: 'daftar admins',
    };

    const parsedMessage = parseMessage(message);
    const expected = {
      command: 'admins',
      type: 'query',
      queries: {},
    };

    expect(expected).toEqual(parsedMessage);
  });

  it('should parse channels message correctly', () => {
    const message = {
      text: 'daftar channels',
      match: 'daftar channels',
    };

    const parsedMessage = parseMessage(message);
    const expected = {
      command: 'channels',
      type: 'query',
      queries: {},
    };

    expect(expected).toEqual(parsedMessage);
  });

  it('should parse promote message correctly', () => {
    const message = {
      text: 'promosikan user try.aji',
      match: 'promosikan',
    };

    const parsedMessage = parseMessage(message);
    const expected = {
      command: 'promote',
      type: 'query',
      queries: {
        user: 'try.aji',
      },
    };

    expect(expected).toEqual(parsedMessage);
  });

  it('should parse demote message correctly', () => {
    const message = {
      text: 'demosikan user try.aji',
      match: 'demosikan',
    };

    const parsedMessage = parseMessage(message);
    const expected = {
      command: 'demote',
      type: 'query',
      queries: {
        user: 'try.aji',
      },
    };

    expect(expected).toEqual(parsedMessage);
  });

  it('should parse activate channel correctly', () => {
    const message = {
      text: 'aktifkan channel public-testing-bot',
      match: 'aktifkan',
    };

    const parsedMessage = parseMessage(message);
    const expected = {
      command: 'activate',
      type: 'query',
      queries: {
        channel: 'public-testing-bot',
      },
    };

    expect(expected).toEqual(parsedMessage);
  });

  it('should parse deactivate channel correctly', () => {
    const message = {
      text: 'nonaktifkan channel public-testing-bot',
      match: 'nonaktifkan',
    };

    const parsedMessage = parseMessage(message);
    const expected = {
      command: 'deactivate',
      type: 'query',
      queries: {
        channel: 'public-testing-bot',
      },
    };

    expect(expected).toEqual(parsedMessage);
  });
});

describe('MessageUtil component, the rest (libs/MessageUtil)', () => {
  it('should convert to the long date format', () => {
    const date1 = '25-05-2015';
    const date2 = '25/05/2015';
    const date3 = '25 Mei 2015';

    const expectedDate = 'Senin, 25 Mei 2015';

    const formattedDate1 = formatDatetime(date1);
    const formattedDate2 = formatDatetime(date2);
    const formattedDate3 = formatDatetime(date3);

    expect(formattedDate1).toBe(expectedDate);
    expect(formattedDate2).toBe(expectedDate);
    expect(formattedDate3).toBe(expectedDate);
  });

  it('should determine correctly whether the date is valid or not', () => {
    const date1 = '25-05-2015';
    const date2 = '25 hehe 2015';

    const expectedDate = 'Senin, 25 Mei 2015';

    const formattedDate1 = formatDatetime(moment(date1, validDateFormats));
    const formattedDate2 = formatDatetime(moment(date2, validDateFormats));

    expect(formattedDate1).toBe(expectedDate);
    expect(formattedDate2).toBe('Invalid date');
  });

  it('should get media query params, even if it is undefined', () => {
    const defaultStartDate = moment()
      .hour(0)
      .minute(0)
      .second(0)
      .startOf('week')
      .format('DD-MM-YYYY');
    const defaultEndDate = moment()
      .hour(0)
      .minute(0)
      .second(0)
      .endOf('week')
      .format('DD-MM-YYYY');

    const queries1 = {};
    const queries2 = { startDate: '25-05-2015', endDate: '25-05-2015' };

    const parsedObject1 = getMediaQueryParams(queries1);
    const parsedObject2 = getMediaQueryParams(queries2);

    expect(parsedObject1).toEqual({
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    });
    expect(parsedObject2).toEqual(queries2);
  });
});
