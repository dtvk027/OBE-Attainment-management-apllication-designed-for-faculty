import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { yearId, semesterId, globalSubjectId, section } = await request.json();

    if (!yearId || !semesterId || !globalSubjectId || !section) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Get Course Info from global subject catalog
    const globalSubject = await db.globalSubject.findUnique({
      where: { id: parseInt(globalSubjectId) }
    });

    if (!globalSubject) {
      return NextResponse.json({ error: 'Selected subject not found in global catalog' }, { status: 404 });
    }

    // 2. Pick the institution-wide standard template
    let template = await db.template.findFirst({
      where: { name: { contains: 'Standard' } },
      orderBy: { id: 'asc' }
    });

    // Fallback if naming convention is different
    if (!template) {
      template = await db.template.findFirst({
        orderBy: { id: 'asc' }
      });
    }

    if (!template) {
        return NextResponse.json({ error: 'No OBE Templates defined. Contact Admin.' }, { status: 500 });
    }

    // 3. Check for existing record to avoid unique constraint violations
    const existingSubject = await db.subject.findUnique({
      where: {
        code_semesterId_section: {
          code: globalSubject.code,
          semesterId: parseInt(semesterId),
          section: section
        }
      }
    });

    if (existingSubject) {
      if (existingSubject.facultyId === session.id) {
        return NextResponse.json({ message: 'Subject already exists', subjectId: existingSubject.id });
      } else {
        return NextResponse.json({ error: 'Subject already assigned to another faculty' }, { status: 403 });
      }
    }

    // 4. Create the new Subject (the "Table")
    const newSubject = await db.subject.create({
      data: {
        globalSubjectId: globalSubject.id,
        code: globalSubject.code,
        name: globalSubject.name,
        facultyId: session.id,
        semesterId: parseInt(semesterId),
        section: section,
        templateId: template.id,
        totalRegistered: 0,
      }
    });


    // 5. Purge the dashboard and hierarchy cache
    revalidatePath('/dashboard');
    revalidatePath('/api/subjects/hierarchy');

    return NextResponse.json({ message: 'Table created successfully', subjectId: newSubject.id });
  } catch (error) {
    console.error('Subject Creation API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
