import { NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { DashboardFilter, DateRangePeriod, MetricDrillDownType } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-1';
    const branchId = searchParams.get('branchId') || 'ALL';
    const period = (searchParams.get('period') as DateRangePeriod) || 'THIS_MONTH';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const drillDown = searchParams.get('drillDown') as MetricDrillDownType | null;

    const filter: DashboardFilter = {
      tenantId,
      branchId,
      period,
      startDate,
      endDate,
    };

    // If drill-down is requested, return itemized reconciling source records
    if (drillDown) {
      const drillDownData = db.getMetricDrillDownRecords(tenantId, drillDown, filter);
      return NextResponse.json({
        success: true,
        drillDown: drillDownData,
      });
    }

    // Otherwise return the reconciled dashboard KPIs
    const dashboardData = db.getReconciledDashboardData(filter);
    return NextResponse.json({
      success: true,
      dashboard: dashboardData,
    });
  } catch (err: any) {
    console.error('Error fetching dashboard data:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
