const winston = require('winston');

const consoleLoggerConfiguration = {
    'transports': [
        new winston.transports.Console()
    ]
};

const fileLoggerConfiguration = {
    'transports': [
        new winston.transports.File({
            filename: 'logs/debug.log'
        })
    ]
};

module.exports = function ({ logger = 'console' }) {
    if (logger == 'console') return winston.createLogger(consoleLoggerConfiguration);
    else if (logger == 'file') return winston.createLogger(fileLoggerConfiguration);
}