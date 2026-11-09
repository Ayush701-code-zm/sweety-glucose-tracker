const { Pool, types } = require('pg');
const config = require('../config');

// Return DATE columns as plain 'YYYY-MM-DD' strings instead of JS Date objects,
// so a reading never shifts a day because of the server timezone.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({ connectionString: config.databaseUrl });

module.exports = pool;
