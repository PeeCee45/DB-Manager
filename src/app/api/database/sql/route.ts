import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { withExternalConnectionDatabase } from '@/lib/db/external';
import { sanitizeIdentifier } from '@/lib/utils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const DESTRUCTIVE_KEYWORDS = ['DROP', 'TRUNCATE', 'DELETE', 'ALTER'];

function isDestructive(sql: string): boolean {
  const upper = sql.trim().toUpperCase();
  return DESTRUCTIVE_KEYWORDS.some(kw => upper.startsWith(kw));
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { connectionId, database, query, confirmed } = body;

    if (!connectionId || !database || !query) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const connId = parseInt(connectionId);
    const safeDb = sanitizeIdentifier(database);
    const sqlQuery = query.trim();

    // Check for destructive queries
    if (isDestructive(sqlQuery) && !confirmed) {
      return NextResponse.json({
        warning: true,
        message: 'This query may modify or delete data. Please confirm to execute.',
      });
    }

    const result = await withExternalConnectionDatabase(connId, user.id, safeDb, async (conn) => {
      const [rows, fields] = await conn.execute(sqlQuery);

      // Check if it's a SELECT-like query
      if (Array.isArray(rows)) {
        const columns = (fields as Array<{ name: string }>).map(f => f.name);
        return {
          type: 'select',
          columns,
          rows: rows as RowDataPacket[],
          rowCount: rows.length,
        };
      } else {
        // It's an INSERT/UPDATE/DELETE/etc
        const header = rows as ResultSetHeader;
        return {
          type: 'command',
          affectedRows: header.affectedRows,
          insertId: header.insertId,
          message: `Query executed successfully. Affected rows: ${header.affectedRows}`,
        };
      }
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('SQL execution error:', error);
    return NextResponse.json(
      { error: err.message || 'Query execution failed' },
      { status: 500 }
    );
  }
}
