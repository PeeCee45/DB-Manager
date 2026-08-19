import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { withExternalConnectionDatabase } from '@/lib/db/external';
import { sanitizeIdentifier } from '@/lib/utils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// GET - Browse rows with pagination, search, sort
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const database = searchParams.get('database');
    const table = searchParams.get('table');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '50');
    const search = searchParams.get('search') || '';
    const sortColumn = searchParams.get('sortColumn') || '';
    const sortDirection = searchParams.get('sortDirection') || 'asc';

    if (!connectionId || !database || !table) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const connId = parseInt(connectionId);
    const safeDb = sanitizeIdentifier(database);
    const safeTable = sanitizeIdentifier(table);
    const offset = (page - 1) * perPage;

    const result = await withExternalConnectionDatabase(connId, user.id, safeDb, async (conn) => {
      // Get columns
      const [columnsResult] = await conn.execute<RowDataPacket[]>(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [safeDb, safeTable]
      );

      const columns = columnsResult.map((c: RowDataPacket) => ({
        name: c.COLUMN_NAME,
        type: c.DATA_TYPE,
        nullable: c.IS_NULLABLE,
        key: c.COLUMN_KEY,
        default: c.COLUMN_DEFAULT,
        extra: c.EXTRA,
      }));

      // Get primary key
      const [pkResult] = await conn.execute<RowDataPacket[]>(
        `SELECT COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY'
         ORDER BY ORDINAL_POSITION`,
        [safeDb, safeTable]
      );
      const primaryKey = pkResult.length > 0 ? pkResult[0].COLUMN_NAME : null;

      // Build query
      let whereClause = '';
      let queryParams: (string | number)[] = [];

      if (search) {
        const searchCols = columns.map((c: { name: string }) => c.name);

        const conditions = searchCols
          .map((col: string) => `\`${safeTable}\`.\`${col}\` LIKE ?`)
          .join(' OR ');

        whereClause = `WHERE ${conditions}`;
        queryParams = searchCols.map(() => `%${search}%`);
      }

      // Get total count
      let total = 0;
      if (search) {
        const [countResult] = await conn.execute<RowDataPacket[]>(
          `SELECT COUNT(*) as count FROM \`${safeTable}\` ${whereClause}`,
          queryParams
        );
        total = countResult[0].count;
      } else {
        const [countResult] = await conn.execute<RowDataPacket[]>(
          `SELECT TABLE_ROWS as count FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
          [safeDb, safeTable]
        );
        total = countResult[0]?.count || 0;
      }

      // Build sort
      let orderClause = '';
      if (sortColumn) {
        const safeSortCol = sanitizeIdentifier(sortColumn);
        const safeDir = sortDirection === 'desc' ? 'DESC' : 'ASC';
        orderClause = `ORDER BY \`${safeSortCol}\` ${safeDir}`;
      }

      // Get rows
      const [rowsResult] = await conn.execute<RowDataPacket[]>(
        `SELECT * FROM \`${safeTable}\` ${whereClause} ${orderClause} LIMIT ? OFFSET ?`,
        [...queryParams, perPage, offset]
      );

      return {
        columns,
        rows: rowsResult,
        total,
        primaryKey,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Browse rows error:', error);
    return NextResponse.json(
      { error: err.message || 'Failed to load rows' },
      { status: 500 }
    );
  }
}

// POST - Insert row
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { connectionId, database, table, data } = body;

    if (!connectionId || !database || !table || !data) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const connId = parseInt(connectionId);
    const safeDb = sanitizeIdentifier(database);
    const safeTable = sanitizeIdentifier(table);

    const columns = Object.keys(data).filter(k => data[k] !== undefined);
    const values = columns.map(k => data[k]);

    const colStr = columns
      .map(c => `\`${sanitizeIdentifier(c)}\``)
      .join(', ');

    const placeholders = columns.map(() => '?').join(', ');

    const result = await withExternalConnectionDatabase(
      connId,
      user.id,
      safeDb,
      async (conn) => {
        const [insertResult] = await conn.execute<ResultSetHeader>(
          `INSERT INTO \`${safeTable}\` (${colStr}) VALUES (${placeholders})`,
          values
        );

        return {
          insertId: insertResult.insertId,
          affectedRows: insertResult.affectedRows,
        };
      }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Insert row error:', error);
    return NextResponse.json(
      { error: err.message || 'Failed to insert row' },
      { status: 500 }
    );
  }
}

// PUT - Update row
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { connectionId, database, table, data, primaryKey, primaryKeyValue } = body;

    if (!connectionId || !database || !table || !data || !primaryKey) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const connId = parseInt(connectionId);
    const safeDb = sanitizeIdentifier(database);
    const safeTable = sanitizeIdentifier(table);
    const safePk = sanitizeIdentifier(primaryKey);

    const columns = Object.keys(data).filter(k => k !== primaryKey && data[k] !== undefined);
    const values = columns.map(k => data[k]);

    const setClause = columns
      .map(c => `\`${sanitizeIdentifier(c)}\` = ?`)
      .join(', ');

    const result = await withExternalConnectionDatabase(
      connId,
      user.id,
      safeDb,
      async (conn) => {
        const [updateResult] = await conn.execute<ResultSetHeader>(
          `UPDATE \`${safeTable}\` SET ${setClause} WHERE \`${safePk}\` = ?`,
          [...values, primaryKeyValue]
        );

        return {
          affectedRows: updateResult.affectedRows,
        };
      }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Update row error:', error);
    return NextResponse.json(
      { error: err.message || 'Failed to update row' },
      { status: 500 }
    );
  }
}

// DELETE - Delete row
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const database = searchParams.get('database');
    const table = searchParams.get('table');
    const primaryKey = searchParams.get('primaryKey');
    const primaryKeyValue = searchParams.get('primaryKeyValue');

    if (!connectionId || !database || !table || !primaryKey || primaryKeyValue === null) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const connId = parseInt(connectionId);
    const safeDb = sanitizeIdentifier(database);
    const safeTable = sanitizeIdentifier(table);
    const safePk = sanitizeIdentifier(primaryKey);

    const result = await withExternalConnectionDatabase(connId, user.id, safeDb, async (conn) => {
      const [deleteResult] = await conn.execute<ResultSetHeader>(
        `DELETE FROM \`${safeTable}\` WHERE \`${safePk}\` = ?`,
        [primaryKeyValue]
      );
      return { affectedRows: deleteResult.affectedRows };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Delete row error:', error);
    return NextResponse.json(
      { error: err.message || 'Failed to delete row' },
      { status: 500 }
    );
  }
}
