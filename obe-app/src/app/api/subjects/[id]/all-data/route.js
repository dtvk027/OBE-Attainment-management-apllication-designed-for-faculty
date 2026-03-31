import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subjectId = parseInt(params.id);
    if (isNaN(subjectId)) {
      return NextResponse.json({ error: 'Invalid Subject ID' }, { status: 400 });
    }

    const subject = await db.subject.findUnique({
      where: { id: subjectId },
      include: {
        template: true,
        semester: { include: { academicYear: true } },
        students: {
          include: {
            marks: true
          }
        },
        coPOMappings: true,
        surveyResponses: true,
        faculty: { select: { name: true } },
        globalSubject: true
      }
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    if (subject.facultyId !== session.id && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(subject);
  } catch (error) {
    console.error('Error fetching subject all-data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
