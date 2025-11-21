// src/utils/logger.js
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

const getTimestamp = () => new Date().toISOString();

const logger = {
  info: (message, meta = '') => 
    console.log(`${colors.green}[${getTimestamp()}] INFO:${colors.reset} ${message}`, meta),
  
  error: (message, meta = '') => 
    console.error(`${colors.red}[${getTimestamp()}] ERROR:${colors.reset} ${message}`, meta),
    
  warn: (message, meta = '') =>
    console.warn(`${colors.yellow}[${getTimestamp()}] WARN:${colors.reset} ${message}`, meta),
    
  debug: (message, meta = '') => 
    process.env.NODE_ENV !== 'production' && 
    console.debug(`${colors.blue}[${getTimestamp()}] DEBUG:${colors.reset} ${message}`, meta),
    
  http: (message, meta = '') =>
    console.info(`${colors.magenta}[${getTimestamp()}] HTTP:${colors.reset} ${message}`, meta)
};

module.exports = logger;