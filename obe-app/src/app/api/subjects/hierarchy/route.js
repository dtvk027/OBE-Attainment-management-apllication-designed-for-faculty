import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get all Academic Years
    const academicYears = await db.academicYear.findMany({
      include: { semesters: true },
      orderBy: { label: 'desc' },
    });

    // 2. Get all existing subjects assigned to this faculty to determine their current "tables"
    const mySubjects = await db.subject.findMany({
      where: { facultyId: session.id },
      include: {
        semester: { include: { academicYear: true } },
      },
    });

    // 3. Get the admin-managed global catalog
    const allUniqueSubjects = await db.globalSubject.findMany({
      orderBy: { code: 'asc' },
      select: { id: true, code: true, name: true },
    });

    return NextResponse.json({
      academicYears,
      mySubjects,
      globalCatalog: allUniqueSubjects,
    });
  } catch (error) {
    console.error('Hierarchy API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch hierarchy' }, { status: 500 });
  }
}
