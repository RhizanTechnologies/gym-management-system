import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { getAuthenticatedUser } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (user && user.role !== 'SUPER_ADMIN') {
    // Isolated tenant view: non-super-admins never receive other organizations
    const tenant = db.getTenantById(user.tenantId);
    return NextResponse.json({ tenants: tenant ? [tenant] : [] });
  }

  const tenants = db.getTenants();
  return NextResponse.json({ tenants });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const newTenant = db.createTenant({
      name: body.name,
      slug: body.slug,
      logo: body.logo || '🏋️',
      address: body.address || '123 Fitness Ave',
      phone: body.phone || '+251 90 000 0000',
      email: body.email || 'info@gym.com',
      currency: body.currency || 'ETB',
      currencySymbol: body.currencySymbol || 'ETB',
      maxCapacity: Number(body.maxCapacity) || 100,
      monthlySubscriptionFee: Number(body.monthlySubscriptionFee) || 79,
      planTier: body.planTier || 'PRO',
      isActive: true,
    });

    return NextResponse.json({ tenant: newTenant }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create tenant';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Tenant id is required' }, { status: 400 });
    }

    const updated = db.updateTenant(body.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({ tenant: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update tenant';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
