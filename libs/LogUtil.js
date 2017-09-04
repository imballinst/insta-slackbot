// Import modules
const moment = require('moment');
const winston = require('winston');

// Custom logger
const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      timestamp() {
        return moment().format('DD-MM-YYYY HH:mm Z');
      },
      formatter(options) {
        const level = `[${options.level.toUpperCase()}] `;
        const timestamp = `${options.timestamp()}:`;
        const message = options.message ? ` ${options.message}` : '';
        const meta = options.meta && Object.keys(options.meta).length > 0 ?
          `\n\t${JSON.stringify(options.meta)}` : '';

        // Return string will be passed to logger.
        return level + timestamp + message + meta;
      },
    }),
  ],
});

const LogUtil = {
  winstonLog: logger.log,
  winstonInfo: logger.info,
  winstonError: logger.error,
};

// Export app
module.exports = LogUtil;
