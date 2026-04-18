const fs = require('fs');
const path = require('path');

const logFile = path.join(process.cwd(), 'server.log');

const logger = {
  info: (msg) => {
    const entry = `[INFO] ${new Date().toISOString()}: ${msg}\n`;
    console.log(entry.trim());
    // fs.appendFileSync(logFile, entry); // Uncomment for persistent logging
  },
  error: (msg) => {
    const entry = `[ERROR] ${new Date().toISOString()}: ${msg}\n`;
    console.error(entry.trim());
  },
  ws: (msg) => {
    const entry = `[WS] ${new Date().toISOString()}: ${msg}\n`;
    console.log(entry.trim());
  }
};

module.exports = logger;
