import { NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'tenant-1';

  const analytics = db.getAnalytics(tenantId);
  return NextResponse.json({ analytics });
}
