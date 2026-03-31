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

    const data = await request.json();
    const updatedSubject = await db.subject.update({
      where: { id: subjectId },
      data: {
        department: data.department !== undefined ? data.department : undefined,
        program: data.program !== undefined ? data.program : undefined,
        coStatements: data.coStatements !== undefined ? data.coStatements : undefined,
      }
    });

    return NextResponse.json({ success: true, subject: updatedSubject });
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json(
      { error: 'Failed to update subject details' },
      { status: 500 }
    );
  }
}
