require('dotenv').config({ quiet: true });

const isTest = process.env.NODE_ENV === 'test';

const config = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

if (!config.databaseUrl) {
  throw new Error(`Missing ${isTest ? 'TEST_DATABASE_URL' : 'DATABASE_URL'} in environment`);
}
if (!config.jwtSecret) {
  throw new Error('Missing JWT_SECRET in environment');
}

module.exports = config;
