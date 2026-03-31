import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(request, { params }) {
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
      select: { facultyId: true }
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    if (subject.facultyId !== session.id && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, assessmentId, coCode, marksObtained, maxMarks } = body;

    if (!studentId || !assessmentId || !coCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedMark = await db.mark.upsert({
      where: {
        studentId_subjectId_assessmentId_coCode: {
          studentId: parseInt(studentId),
          subjectId,
          assessmentId,
          coCode,
        }
      },
      update: {
        marksObtained: marksObtained !== undefined ? parseFloat(marksObtained) : null,
        ...(maxMarks !== undefined && { maxMarks: parseFloat(maxMarks) })
      },
      create: {
        studentId: parseInt(studentId),
        subjectId,
        assessmentId,
        coCode,
        marksObtained: marksObtained !== undefined ? parseFloat(marksObtained) : null,
        maxMarks: maxMarks !== undefined ? parseFloat(maxMarks) : null,
      }
    });

    return NextResponse.json(updatedMark);
  } catch (error) {
    console.error('Error updating marks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
