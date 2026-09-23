import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { authorizeServerRequest } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'tenant-1';

  // Plans can be viewed by all roles (including public packages)
  const plans = db.getPlans(tenantId);
  return NextResponse.json({ plans });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';

    // Server-side authorization check: Only OWNER and GENERAL_MANAGER can configure packages
    const auth = authorizeServerRequest(request, 'CONFIG_BUSINESS_PACKAGES', 'MANAGE', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (!body.name || !body.durationDays || body.price === undefined) {
      return NextResponse.json({ error: 'Name, durationDays and price are required' }, { status: 400 });
    }

    const plan = db.createPlan(tenantId, {
      name: body.name,
      description: body.description || '',
      durationDays: Number(body.durationDays),
      price: Number(body.price),
      admissionFee: Number(body.admissionFee) || 0,
      maxVisitsPerDay: Number(body.maxVisitsPerDay) || 1,
      includesClasses: Boolean(body.includesClasses),
      color: body.color || '#0F766E',
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : true,
      billingPeriod: body.billingPeriod || (Number(body.durationDays) === 1 ? '1 Day' : Number(body.durationDays) === 30 ? 'Monthly' : Number(body.durationDays) === 90 ? 'Quarterly' : Number(body.durationDays) === 365 ? 'Annual' : `${body.durationDays} Days`),
      benefits: Array.isArray(body.benefits) ? body.benefits : (body.benefits ? [String(body.benefits)] : []),
      restrictions: Array.isArray(body.restrictions) ? body.restrictions : (body.restrictions ? [String(body.restrictions)] : []),
      includedServices: Array.isArray(body.includedServices) ? body.includedServices : (body.includedServices ? [String(body.includedServices)] : []),
      isPopular: Boolean(body.isPopular),
    });

    db.recordAuditEvent({
      tenantId,
      actorId: auth.user!.id,
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      action: 'PACKAGE_CREATE',
      entityType: 'PLAN',
      entityId: plan.id,
      details: `Created membership package '${plan.name}' (${plan.durationDays} days) for ${plan.price}`,
    });

    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create plan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';

    // Server-side authorization check: Only OWNER and GENERAL_MANAGER can configure packages
    const auth = authorizeServerRequest(request, 'CONFIG_BUSINESS_PACKAGES', 'MANAGE', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (!body.id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const updated = db.updatePlan(tenantId, body.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    db.recordAuditEvent({
      tenantId,
      actorId: auth.user!.id,
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      action: 'PACKAGE_UPDATE',
      entityType: 'PLAN',
      entityId: updated.id,
      details: `Updated package '${updated.name}' details and pricing`,
    });

    return NextResponse.json({ success: true, plan: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update plan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const tenantId = body.tenantId || searchParams.get('tenantId') || 'tenant-1';
    const id = body.id || searchParams.get('id');

    // Server-side authorization check: Only OWNER can delete/deactivate packages
    const auth = authorizeServerRequest(request, 'CONFIG_BUSINESS_PACKAGES', 'FULL', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const success = db.deletePlan(tenantId, id);
    if (!success) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    db.recordAuditEvent({
      tenantId,
      actorId: auth.user!.id,
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      action: 'PACKAGE_UPDATE',
      entityType: 'PLAN',
      entityId: id,
      details: `Removed membership package '${id}'`,
    });

    return NextResponse.json({ success: true, message: 'Plan deleted successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete plan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
