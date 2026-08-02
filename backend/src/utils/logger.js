'use strict';

const fs   = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'app.log');

function timestamp() {
  return new Date().toISOString();
}

function write(level, message, meta) {
  const line = JSON.stringify({ timestamp: timestamp(), level, message, ...(meta || {}) });
  // Console
  console.log(line);
  // File (append)
  fs.appendFileSync(logFile, line + '\n');
}

const logger = {
  info:  (msg, meta) => write('INFO',  msg, meta),
  warn:  (msg, meta) => write('WARN',  msg, meta),
  error: (msg, meta) => write('ERROR', msg, meta),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') write('DEBUG', msg, meta);
  },
};

module.exports = logger;
