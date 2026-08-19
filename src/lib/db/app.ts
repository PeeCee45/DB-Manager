import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getAppDb(): mysql.Pool {
  if (!pool) {
    const host = process.env.APP_DB_HOST || 'localhost';
    const port = parseInt(process.env.APP_DB_PORT || '3306');
    const database = process.env.APP_DB_NAME || 'db_manager';
    const user = process.env.APP_DB_USER || 'root';
    const password = process.env.APP_DB_PASSWORD || '';

    pool = mysql.createPool({
      host,
      port,
      database,
      user,
      password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
}
