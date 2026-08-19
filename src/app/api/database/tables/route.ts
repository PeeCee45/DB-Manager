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

    if (!connectionId || !database) {
      return NextResponse.json({ error: 'Connection ID and database required' }, { status: 400 });
    }

    const connId = parseInt(connectionId);
    const safeDb = sanitizeIdentifier(database);

    const tables = await withExternalConnectionDatabase(connId, user.id, safeDb, async (conn) => {
      const [rows] = await conn.execute<RowDataPacket[]>(
        `SELECT 
          t.TABLE_NAME as name,
          t.ENGINE as engine,
          t.TABLE_ROWS as rows_count,
          t.DATA_LENGTH + t.INDEX_LENGTH as size
        FROM information_schema.TABLES t
        WHERE t.TABLE_SCHEMA = ?
        ORDER BY t.TABLE_NAME`,
        [safeDb]
      );

      return rows.map((row: RowDataPacket) => ({
        name: row.name,
        engine: row.engine,
        rows: row.rows_count,
        size: row.size,
      }));
    });

    return NextResponse.json({ tables });
  } catch (error) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('List tables error:', error);
    return NextResponse.json(
      { error: err.message || 'Failed to load tables' },
      { status: 500 }
    );
  }
}
