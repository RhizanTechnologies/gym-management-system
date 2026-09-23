import { NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { authorizeServerRequest } from '@/lib/rbac';
import { User } from '@/lib/types';

export async function GET(request: Request) {
  return handleExport(request);
}

export async function POST(request: Request) {
  return handleExport(request);
}

async function handleExport(request: Request) {
  try {
    const url = new URL(request.url);
    let tenantId = url.searchParams.get('tenantId') || 'tenant-1';
    let branchId = url.searchParams.get('branchId') || 'ALL';
    let reportType = (url.searchParams.get('reportType') as 'FINANCIAL' | 'MEMBERSHIP' | 'CHECK_IN' | 'EXPENSES') || 'FINANCIAL';
    let format = (url.searchParams.get('format')?.toUpperCase() as 'CSV' | 'JSON') || 'CSV';

    if (request.method === 'POST') {
      try {
        const body = await request.json();
        if (body.tenantId) tenantId = body.tenantId;
        if (body.branchId) branchId = body.branchId;
        if (body.reportType) reportType = body.reportType;
        if (body.format) format = body.format.toUpperCase();
      } catch (e) {
        // query params fallback
      }
    }

    // Role-based authorization gate (REPORTS_EXPORTS: 'MANAGE')
    // Owners, General Managers, and Finance Officers have MANAGE or FULL.
    // Receptionists, Trainers, and Maintenance staff only have VIEW or OWN_ONLY.
    const auth = authorizeServerRequest(request, 'REPORTS_EXPORTS', 'MANAGE', tenantId);
    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: auth.status === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED',
          message: auth.error || 'You do not have permission to export organizational reports.',
        },
        { status: auth.status }
      );
    }

    const actor: User = {
      id: auth.user!.id,
      tenantId: auth.user!.tenantId,
      name: auth.user!.name,
      email: auth.user!.email,
      role: auth.user!.role,
      isActive: auth.user!.isActive,
      createdAt: new Date().toISOString(),
    };

    const exported = db.exportReportData(tenantId, branchId, reportType, format, actor);

    return new NextResponse(exported.data, {
      status: 200,
      headers: {
        'Content-Type': exported.contentType,
        'Content-Disposition': `attachment; filename="${exported.filename}"`,
        'X-Report-Type': reportType,
        'X-Report-Format': format,
        'X-Organization-Id': tenantId,
        'X-Branch-Id': branchId,
      },
    });
  } catch (err: any) {
    console.error('Error in reports export:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message?.includes('FORBIDDEN') ? 'FORBIDDEN' : 'SERVER_ERROR',
        message: err.message || 'Failed to export report.',
      },
      { status: err.message?.includes('FORBIDDEN') ? 403 : 500 }
    );
  }
}
