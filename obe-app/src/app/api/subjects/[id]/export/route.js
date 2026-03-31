import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import Exporter from '@/lib/xlsx/exporter';
import {
  calcDirectAttainment,
  calcIndirectAttainment,
  calcCombinedAttainment,
  calcPOAttainment
} from '@/lib/calc-engine';

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
        students: {
          include: {
            marks: true
          }
        },
        coPOMappings: true,
        surveyResponses: true,
      }
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    if (subject.facultyId !== session.id && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const direct = calcDirectAttainment(subject.students, subject.template);
    const indirect = calcIndirectAttainment(subject.surveyResponses, subject.template);
    const combined = calcCombinedAttainment(direct.summary.combined, indirect, subject.template);
    const poPso = calcPOAttainment(combined, subject.coPOMappings, subject.template);

    const calculations = {
      direct,
      indirect,
      combined,
      poPso,
      studentResults: direct.studentResults
    };

    const buffer = Exporter.exportAll(subject, calculations);
    const sanitizedFilename = (subject.code + '-' + subject.name).replace(/[^a-z0-9]/gi, '_').toLowerCase();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${sanitizedFilename}_attainment.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  } catch (error) {
    console.error('Error generating export:', error);
    return NextResponse.json({ error: 'Failed to generate export file' }, { status: 500 });
  }
}
