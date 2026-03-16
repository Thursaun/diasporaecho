/**
 * Environment-aware Logger
 * Only logs in development mode, suppresses in production
 */

const isDev = process.env.NODE_ENV !== 'production';

const logger = {
    log: (...args) => isDev && console.log(...args),
    info: (...args) => isDev && console.info('ℹ️', ...args),
    warn: (...args) => console.warn('⚠️', ...args), // Always log warnings
    error: (...args) => console.error('❌', ...args), // Always log errors
    debug: (...args) => isDev && console.log('🔍', ...args),
    success: (...args) => isDev && console.log('✅', ...args),
};

module.exports = logger;
