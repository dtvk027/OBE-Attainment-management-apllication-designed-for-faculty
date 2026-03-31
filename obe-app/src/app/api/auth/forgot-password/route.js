import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendRecoveryEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });

    // Important: To prevent email enumeration, we respond generically
    // whether the email exists or not.
    if (!user) {
      return NextResponse.json({ message: 'If an account exists, a recovery code has been sent.' });
    }

    // Optional: Rate limit checks could go here

    // Generate a secure 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();

    // Invalidate old unused codes
    await db.recoveryCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true }
    });

    // Store the new code, expires in 15 minutes
    await db.recoveryCode.create({
      data: {
        userId: user.id,
        code: code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), 
      }
    });

    // Send the email
    const emailSent = await sendRecoveryEmail(user.email, code);

    if (!emailSent) {
      console.warn("Emails failed to send. Are credentials configured in .env?");
      // We still return success to prevent enum unless we want to be explicit internally
    }

    return NextResponse.json({ message: 'If an account exists, a recovery code has been sent.' });
  } catch (error) {
    console.error('Error with forgot password:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
