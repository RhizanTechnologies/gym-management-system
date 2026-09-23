import { NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { DashboardFilter, DateRangePeriod } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-1';
    const branchId = searchParams.get('branchId') || 'ALL';
    const period = (searchParams.get('period') as DateRangePeriod) || 'THIS_YEAR';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const filter: DashboardFilter = {
      tenantId,
      branchId,
      period,
      startDate,
      endDate,
    };

    const report = db.getFinancialAndMembershipReport(tenantId, filter);
    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: any) {
    console.error('Error generating report:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
