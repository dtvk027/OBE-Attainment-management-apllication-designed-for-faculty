import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subjects = await db.globalSubject.findMany({
      orderBy: { code: 'asc' },
      include: {
        subjects: {
          include: { 
            faculty: { select: { name: true } },
            semester: { include: { academicYear: true } }
          }
        }
      }
    });
    return NextResponse.json(subjects);
  } catch (error) {
    console.error('Error fetching global subjects:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const code = formData.get('code');
    const file = formData.get('documentation');

    if (!name || !code || !file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if code already exists
    const existing = await db.globalSubject.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Subject code already exists' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Save File
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileName = `${code.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    const relativeDir = join('uploads', 'docs');
    const fullDir = join(process.cwd(), 'public', relativeDir);
    const path = join(fullDir, fileName);
    
    await writeFile(path, buffer);
    const documentationPath = `/${relativeDir}/${fileName}`.replace(/\\/g, '/');

    const newSubject = await db.globalSubject.create({
      data: {
        name,
        code,
        documentationPath
      }
    });

    return NextResponse.json(newSubject);
  } catch (error) {
    console.error('Error creating global subject:', error);
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}
