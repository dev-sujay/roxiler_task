// middlewares/logger.js
const morgan = require('morgan');

const logger = morgan('dev');

module.exports = logger;
