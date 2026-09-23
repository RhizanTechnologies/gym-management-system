import { NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-1';

    const branches = db.getBranches(tenantId);
    return NextResponse.json({
      success: true,
      branches,
    });
  } catch (err: any) {
    console.error('Error fetching branches:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
