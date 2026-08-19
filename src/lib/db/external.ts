// src/lib/db/external.ts
import mysql from 'mysql2/promise';
import { decrypt } from '@/lib/crypto';
import { getAppDb } from './app';
import { RowDataPacket } from 'mysql2/promise';

interface ConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database?: string;
}

const useSSL = process.env.APP_DB_SSL === "true";

export async function getConnectionConfig(connectionId: number, userId: number): Promise<ConnectionConfig> {
  const db = await getAppDb();
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT host, port, username, encrypted_password, database_name FROM connections WHERE id = ? AND user_id = ?',
    [connectionId, userId]
  );

  if (rows.length === 0) {
    throw new Error('Connection not found');
  }

  const conn = rows[0];
  const password = decrypt(conn.encrypted_password);

  return {
    host: conn.host,
    port: conn.port,
    username: conn.username,
    password,
    database: conn.database_name,
  };
}

export async function createExternalConnection(config: ConnectionConfig): Promise<mysql.Connection> {
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    connectTimeout: 10000,
    enableKeepAlive: true,
    ...(useSSL
      ? {
          ssl: {
            rejectUnauthorized: false,
          },
        }
      : {}),
  });

  return connection;
}

export async function testConnection(config: ConnectionConfig): Promise<{ success: boolean; message: string }> {
  let connection: mysql.Connection | null = null;

  try {
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      connectTimeout: 10000,
      ...(useSSL
      ? {
          ssl: {
            rejectUnauthorized: false,
          },
        }
      : {}),
    });

    await connection.ping();

    // Get server version
    const [rows] = await connection.execute<RowDataPacket[]>('SELECT VERSION() as version');
    const version = rows[0]?.version || 'unknown';

    return {
      success: true,
      message: `Connected successfully. Server version: ${version}`,
    };
  } catch (error) {
    const err = error as Error;
    let message = 'Connection failed';

    if (err.message.includes('ECONNREFUSED')) {
      message = 'Connection refused. Please check the hostname and port.';
    } else if (err.message.includes('ETIMEDOUT')) {
      message = 'Connection timed out. Please check your network or firewall settings.';
    } else if (err.message.includes('Access denied')) {
      message = 'Access denied. Please check your username and password.';
    } else if (err.message.includes('Unknown database')) {
      message = 'Unknown database. Please check the database name.';
    } else if (err.message.includes('getaddrinfo')) {
      message = 'Host not found. Please check the hostname.';
    } else {
      message = `Connection failed: ${err.message}`;
    }

    return { success: false, message };
  } finally {
    if (connection) {
      await connection.end().catch(() => {});
    }
  }
}

export async function withExternalConnection<T>(
  connectionId: number,
  userId: number,
  callback: (conn: mysql.Connection) => Promise<T>
): Promise<T> {
  const config = await getConnectionConfig(connectionId, userId);
  const connection = await createExternalConnection(config);

  try {
    return await callback(connection);
  } finally {
    await connection.end().catch(() => {});
  }
}

export async function withExternalConnectionDatabase<T>(
  connectionId: number,
  userId: number,
  database: string,
  callback: (conn: mysql.Connection) => Promise<T>
): Promise<T> {
  const config = await getConnectionConfig(connectionId, userId);
  const connection = await createExternalConnection({ ...config, database });

  try {
    return await callback(connection);
  } finally {
    await connection.end().catch(() => {});
  }
}
