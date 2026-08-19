import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { withExternalConnectionDatabase } from '@/lib/db/external';
import { sanitizeIdentifier } from '@/lib/utils';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const database = searchParams.get('database');
    const table = searchParams.get('table');

    if (!connectionId || !database || !table) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const connId = parseInt(connectionId);
    const safeDb = sanitizeIdentifier(database);
    const safeTable = sanitizeIdentifier(table);

    const result = await withExternalConnectionDatabase(connId, user.id, safeDb, async (conn) => {
      // Columns
      const [columnsResult] = await conn.execute<RowDataPacket[]>(
        `SELECT 
          COLUMN_NAME as name,
          DATA_TYPE as type,
          IS_NULLABLE as nullable,
          COLUMN_KEY as key_col,
          COLUMN_DEFAULT as default_val,
          EXTRA as extra,
          CHARACTER_MAXIMUM_LENGTH as max_length,
          NUMERIC_PRECISION as numeric_precision,
          NUMERIC_SCALE as numeric_scale
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION`,
        [safeDb, safeTable]
      );

      const columns = columnsResult.map((c: RowDataPacket) => ({
        name: c.name,
        type: c.type + (c.max_length ? `(${c.max_length})` : c.numeric_precision ? `(${c.numeric_precision},${c.numeric_scale || 0})` : ''),
        nullable: c.nullable,
        key: c.key_col,
        default: c.default_val,
        extra: c.extra,
      }));

      // Indexes
      const [indexesResult] = await conn.execute<RowDataPacket[]>(
        `SELECT 
          INDEX_NAME as name,
          COLUMN_NAME as column_name,
          NON_UNIQUE as non_unique,
          INDEX_TYPE as type
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
        [safeDb, safeTable]
      );

      const indexes = indexesResult.map((i: RowDataPacket) => ({
        name: i.name,
        column: i.column_name,
        unique: i.non_unique === 0,
        type: i.type,
      }));

      // Table info
      const [tableInfo] = await conn.execute<RowDataPacket[]>(
        `SELECT 
          ENGINE as engine,
          TABLE_ROWS as row_count,
          DATA_LENGTH as data_length,
          INDEX_LENGTH as index_length,
          TABLE_COLLATION as collation,
          CREATE_TIME as create_time,
          UPDATE_TIME as update_time
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [safeDb, safeTable]
      );

      return {
        columns,
        indexes,
        tableInfo: tableInfo[0] || null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Structure error:', error);
    return NextResponse.json(
      { error: err.message || 'Failed to load structure' },
      { status: 500 }
    );
  }
}
