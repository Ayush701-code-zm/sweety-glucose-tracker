process.env.NODE_ENV = 'test';
require('dotenv').config({ quiet: true });

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/sweety_test';
