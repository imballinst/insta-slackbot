import moment from 'moment';

import { parseMessage, getMediaQueryParams } from '../MessageUtil';

describe('MessageUtil component (libs/MessageUtil)', () => {
  it('should parse message correctly', () => {
    // Messages
    const message = {
      text: '!mostlikes --from 27-07-2017 --to 28-07-2017 --sort likes:asc'
    };
    const message2 = {
      text: '!mostlikes -f 27-07-2017 -t 28-07-2017 -s likes:asc'
    };

    // Parsed messages
    const parsedMessage = parseMessage(message);
    const parsedMessage2 = parseMessage(message);

    // Expected output
    const expected = {
      command: 'mostlikes',
      type: 'query',
      queries: {
        startDate: '27-07-2017',
        endDate: '28-07-2017',
        sort: 'likes:asc'
      },
    };

    expect(expected).toEqual(parsedMessage);
    expect(expected).toEqual(parsedMessage2);
  });

  it('should convert parsed message queries to query params', () => {
    // Parsed message
    const parsedMessageQueries = {
      startDate: '27-07-2017',
      endDate: '28-07-2017',
      sort: 'likes:asc'
    };

    // Expected output
    const expected = {
      startDate: '27-07-2017',
      endDate: '28-07-2017',
      sort: 'likes:asc',
    };

    expect(expected).toEqual(getMediaQueryParams(parsedMessageQueries));
  });
});
