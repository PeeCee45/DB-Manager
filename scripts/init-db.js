const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDb() {
  const host = process.env.APP_DB_HOST || 'localhost';
  const port = parseInt(process.env.APP_DB_PORT || '3306');
  const user = process.env.APP_DB_USER || 'root';
  const password = process.env.APP_DB_PASSWORD || '';

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  console.log('Initializing database...');
  await connection.query(schema);
  console.log('Database initialized successfully!');
  await connection.end();
}

initDb().catch(err => {
  console.error('Failed to initialize database:', err.message);
  process.exit(1);
});
