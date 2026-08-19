import { NextRequest, NextResponse } from 'next/server';
import { getAppDb } from '@/lib/db/app';
import { requireAuth } from '@/lib/auth/session';
import { encrypt } from '@/lib/crypto';
import { RowDataPacket } from 'mysql2/promise';

// GET - List all connections for current user
export async function GET() {
  try {
    const user = await requireAuth();
    const db = await getAppDb();

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, name, host, port, username, database_name, 
              created_at, updated_at, last_used_at 
       FROM connections WHERE user_id = ? ORDER BY updated_at DESC`,
      [user.id]
    );

    return NextResponse.json({ connections: rows });
  } catch (error) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('List connections error:', error);
    return NextResponse.json(
      { error: 'Failed to load connections' },
      { status: 500 }
    );
  }
}

// POST - Create new connection
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, host, port, username, password, database_name } = body;

    // Validation
    if (!name || !host || !username || !database_name) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const encryptedPassword = encrypt(password || '');
    const db = await getAppDb();

    const [result] = await db.execute(
      `INSERT INTO connections (user_id, name, host, port, username, encrypted_password, database_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.id, name, host, port, username, encryptedPassword, database_name]
    );

    const connectionId = (result as { insertId: number }).insertId;

    return NextResponse.json({ 
      success: true, 
      connection: { id: connectionId, name, host, port, username, database_name } 
    });
  } catch (error) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create connection error:', error);
    return NextResponse.json(
      { error: 'Failed to save connection' },
      { status: 500 }
    );
  }
}

// PUT - Update connection
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { id, name, host, port, username, password, database_name } = body;

    if (!id) {
      return NextResponse.json({ error: 'Connection ID required' }, { status: 400 });
    }

    const db = await getAppDb();

    // Check ownership
    const [existing] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM connections WHERE id = ? AND user_id = ?',
      [id, user.id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    let query: string;
    let params: (string | number)[];

    if (password && password.length > 0) {
      const encryptedPassword = encrypt(password);
      query = `UPDATE connections SET name=?, host=?, port=?, username=?, encrypted_password=?, database_name=? WHERE id=? AND user_id=?`;
      params = [name, host, port, username, encryptedPassword, database_name, id, user.id];
    } else {
      query = `UPDATE connections SET name=?, host=?, port=?, username=?, database_name=? WHERE id=? AND user_id=?`;
      params = [name, host, port, username, database_name, id, user.id];
    }

    await db.execute(query, params);

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Update connection error:', error);
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    );
  }
}

// DELETE - Delete connection
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Connection ID required' }, { status: 400 });
    }

    const db = await getAppDb();
    await db.execute(
      'DELETE FROM connections WHERE id = ? AND user_id = ?',
      [parseInt(id), user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Delete connection error:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}
