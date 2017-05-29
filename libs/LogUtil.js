// Import modules
const winston = require('winston');

// Custom logger
const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      formatter(options) {
        const level = `[${options.level.toUpperCase()}] `;
        const message = options.message ? ` ${options.message}` : '';
        const meta = options.meta && Object.keys(options.meta).length > 0 ?
          `\n\t${JSON.stringify(options.meta)}` : '';

        // Return string will be passed to logger.
        return level + message + meta;
      },
    }),
  ],
});

const LogUtil = {};
LogUtil.winston = logger;

// Export app
module.exports = LogUtil;
