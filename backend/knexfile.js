require('dotenv').config();

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3307,
      user: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_NAME || 'ev_charger'
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
};