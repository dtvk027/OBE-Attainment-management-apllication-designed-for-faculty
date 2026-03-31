import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request, context) {
  try {
    const { id } = await context.params;
    const subjectId = parseInt(id);
    const { mappings } = await request.json();

    // 1. Delete existing mappings for this subject to prevent duplicates
    await prisma.cOPOMapping.deleteMany({
      where: { subjectId: subjectId }
    });

    // 2. Insert the new valid mappings (> 0)
    if (mappings && mappings.length > 0) {
       await prisma.cOPOMapping.createMany({
          data: mappings.map(m => ({
            subjectId: subjectId,
            coCode: m.coCode,
            poCode: m.poCode,
            mappingValue: parseInt(m.mappingValue)
          }))
       });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save PO-PSO mappings:", error);
    return NextResponse.json({ error: "Failed to save mappings" }, { status: 500 });
  }
}
