import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';

/**
 * GET /api/admin/users - List all faculty members
 */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await db.user.findMany({
      where: { role: 'faculty' },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        department: true, 
        createdAt: true,
        subjects: {
          include: {
            semester: { include: { academicYear: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

/**
 * POST /api/admin/users - Create a new faculty member
 */
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, email, password, department } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'faculty',
        department,
      },
    });

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      department: newUser.department,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
