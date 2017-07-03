import moment from 'moment';

import { parseMessage, setParamsFromMessage } from '../MessageUtil';

describe('MessageUtil component (libs/MessageUtil)', () => {
  it('should parse message correctly', () => {
    // Messages
    const message = '!mostlikes --from 27-07-2017 --to 28-07-2017 --sort asc:likes';
    const message2 = '!mostlikes -f 27-07-2017 -t 28-07-2017 -s asc:likes';

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
        sort: 'asc:likes'
      },
    };

    expect(expected).toEqual(parsedMessage);
    expect(expected).toEqual(parsedMessage2);
  });

  it('should convert parsed message queries to query params', () => {
    // Parsed message
    const parsedMessage = {
      startDate: moment('27-07-2017', 'DD-MM-YYYY'),
      endDate: moment('28-07-2017', 'DD-MM-YYYY'),
      sort: 'asc:likes'
    };

    // Expected output
    const expected = {
      startDate: moment('27-07-2017', 'DD-MM-YYYY'),
      endDate: moment('28-07-2017', 'DD-MM-YYYY'),
      sort: 'asc:likes',
    };

    expect(expected).toEqual(setParamsFromMessage(parsedMessage));
  });
});
