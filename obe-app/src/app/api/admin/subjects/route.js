import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/admin/subjects - List all subjects and form helper data
 */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [subjects, faculty, templates, academicYears] = await Promise.all([
      db.subject.findMany({
        include: {
          faculty: { select: { name: true } },
          semester: { include: { academicYear: true } },
          template: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      db.user.findMany({ where: { role: 'faculty' }, select: { id: true, name: true } }),
      db.template.findMany({ select: { id: true, name: true } }),
      db.academicYear.findMany({ include: { semesters: true } })
    ]);

    return NextResponse.json({ subjects, faculty, templates, academicYears });
  } catch (error) {
    console.error('Failed to fetch subjects data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/subjects - Create a new subject
 */
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { 
      code, name, facultyId, templateId, semesterId, section, totalRegistered 
    } = await request.json();

    if (!code || !name || !facultyId || !templateId || !semesterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newSubject = await db.subject.create({
      data: {
        code,
        name,
        facultyId: parseInt(facultyId),
        templateId: parseInt(templateId),
        semesterId: parseInt(semesterId),
        section: section || 'A',
        totalRegistered: parseInt(totalRegistered) || 0,
      }
    });

    return NextResponse.json(newSubject);
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}
