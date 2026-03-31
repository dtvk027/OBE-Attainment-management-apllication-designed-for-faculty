import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    // Verify recovery code
    const validCode = await db.recoveryCode.findFirst({
      where: {
        userId: user.id,
        code: code,
        used: false,
        expiresAt: { gt: new Date() } // Must not be expired
      }
    });

    if (!validCode) {
      return NextResponse.json({ error: 'Invalid or expired recovery code' }, { status: 400 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    // Mark code as used
    await db.recoveryCode.update({
      where: { id: validCode.id },
      data: { used: true }
    });

    return NextResponse.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error with reset password:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
