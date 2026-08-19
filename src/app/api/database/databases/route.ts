import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { withExternalConnection } from '@/lib/db/external';
import { getAppDb } from '@/lib/db/app';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID required' }, { status: 400 });
    }

    const connId = parseInt(connectionId);

    // Update last_used_at
    const appDb = await getAppDb();
    await appDb.execute(
      'UPDATE connections SET last_used_at = NOW() WHERE id = ? AND user_id = ?',
      [connId, user.id]
    );

    const databases = await withExternalConnection(connId, user.id, async (conn) => {
      const [rows] = await conn.execute<RowDataPacket[]>(
        `SELECT SCHEMA_NAME as name FROM information_schema.SCHEMATA ORDER BY SCHEMA_NAME`
      );

      const systemDbs = ['information_schema', 'mysql', 'performance_schema', 'sys', 'mariadb'];

      return rows.map((row: RowDataPacket) => ({
        name: row.name,
        isSystem: systemDbs.includes(row.name),
      }));
    });

    return NextResponse.json({ databases });
  } catch (error) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('List databases error:', error);
    return NextResponse.json(
      { error: err.message || 'Failed to load databases' },
      { status: 500 }
    );
  }
}
