import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/admin/templates - List all OBE templates
 */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const templates = await db.template.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

/**
 * POST /api/admin/templates - Create a new OBE template
 */
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      name, 
      coCount, 
      poCount, 
      psoCount, 
      targetPercentage, 
      directWeightage, 
      indirectWeightage, 
      assessmentGroups 
    } = body;

    if (!name || !assessmentGroups) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newTemplate = await db.template.create({
      data: {
        name,
        coCount: coCount || 5,
        poCount: poCount || 12,
        psoCount: psoCount || 3,
        targetPercentage: targetPercentage || 60,
        directWeightage: directWeightage || 0.9,
        indirectWeightage: indirectWeightage || 0.1,
        assessmentGroups: typeof assessmentGroups === 'string' ? assessmentGroups : JSON.stringify(assessmentGroups),
      },
    });

    return NextResponse.json(newTemplate);
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
