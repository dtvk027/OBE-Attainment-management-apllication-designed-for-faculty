import { NextResponse } from 'next/server';
const { db } = require('@/lib/db');
const { getSession } = require('@/lib/auth');

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    
    // Check if user exists
    const user = await db.user.findUnique({
      where: { id },
      include: { subjects: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Faculty member not found' }, { status: 404 });
    }

    // Cascade is handled by DB schema onDelete: Cascade
    // But we perform the deletion here.
    await db.user.delete({ where: { id } });

    return NextResponse.json({ message: 'Faculty member and all associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting faculty:', error);
    return NextResponse.json({ error: 'Failed to delete faculty member' }, { status: 500 });
  }
}
