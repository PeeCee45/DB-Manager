import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAppDb } from '@/lib/db/app';
import { requireAuth } from '@/lib/auth/session';
import { RowDataPacket } from 'mysql2/promise';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New passwords do not match' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const db = await getAppDb();

    // Verify current password
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT password_hash FROM users WHERE id = ?',
      [user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash and update new password
    const newHash = await bcrypt.hash(newPassword, 12);
    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newHash, user.id]
    );

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Update password error:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
}