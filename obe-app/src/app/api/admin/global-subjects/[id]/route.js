import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { revalidatePath } from 'next/cache';

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    const subject = await db.globalSubject.findUnique({
      where: { id },
      include: { subjects: true }
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // Delete file if exists
    if (subject.documentationPath) {
      const fullPath = join(process.cwd(), 'public', subject.documentationPath);
      try {
        await unlink(fullPath);
      } catch (e) {
        console.error('Failed to unlink file:', e);
      }
    }

    await db.globalSubject.delete({ where: { id } });
    
    // Purge the dashboard and hierarchy cache
    revalidatePath('/dashboard');
    revalidatePath('/api/subjects/hierarchy');

    return NextResponse.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting global subject:', error);
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    const formData = await request.formData();
    const name = formData.get('name');
    const code = formData.get('code');
    const file = formData.get('documentation');

    const updateData = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code;

    if (file && file instanceof Blob) {
      if (file.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
      }

      // Save new file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${(code || 'updated').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
      const relativeDir = join('uploads', 'docs');
      const fullDir = join(process.cwd(), 'public', relativeDir);
      const path = join(fullDir, fileName);
      await writeFile(path, buffer);
      updateData.documentationPath = `/${relativeDir}/${fileName}`.replace(/\\/g, '/');

      // (Optional) Delete old file
      const oldSubject = await db.globalSubject.findUnique({ where: { id } });
      if (oldSubject?.documentationPath) {
        const oldFullPath = join(process.cwd(), 'public', oldSubject.documentationPath);
        try { await unlink(oldFullPath); } catch (e) {}
      }
    } else if (file === 'null') {
      // Logic for removing documentation if explicitly requested (though user said it is required, so be careful)
      updateData.documentationPath = null;
    }

    const updated = await db.globalSubject.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating global subject:', error);
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
  }
}
