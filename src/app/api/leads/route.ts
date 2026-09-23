import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { authorizeServerRequest } from '@/lib/rbac';

// Email validation helper
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Phone validation helper
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  return cleaned.length >= 5 && /^\d+$/.test(cleaned);
}

// POST /api/leads - Public Lead Submission (Register, Book Trial, Contact Admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      source = 'REGISTER',
      tenantId = 'tenant-1',
      selectedPackage,
      packageId,
      preferredDate,
      interest,
      message,
    } = body;

    // Validation: Name is required (at least 2 chars)
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid full name (minimum 2 characters).' },
        { status: 400 }
      );
    }

    // Validation: Phone is required (at least 5 digits)
    if (!phone || typeof phone !== 'string' || !isValidPhone(phone)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid phone number (minimum 5 digits).' },
        { status: 400 }
      );
    }

    // Validation: Email format if provided
    if (email && typeof email === 'string' && email.trim() !== '' && !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address or leave it blank.' },
        { status: 400 }
      );
    }

    // Validation: Valid source enum
    const validSources = ['REGISTER', 'TRIAL', 'CONTACT'];
    const sanitizedSource = validSources.includes(source) ? source : 'REGISTER';

    // Deduplication check: if an identical lead with same phone was submitted in the last 60 seconds, reuse it
    const existingLeads = db.getLeads(tenantId);
    const sixtySecondsAgo = Date.now() - 60 * 1000;
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const recentDuplicate = existingLeads.find((l) => {
      const createdTime = new Date(l.createdAt).getTime();
      const lClean = l.phone.replace(/\D/g, '');
      return lClean === cleanPhone && createdTime > sixtySecondsAgo;
    });

    if (recentDuplicate) {
      return NextResponse.json(
        {
          success: true,
          lead: {
            id: recentDuplicate.id,
            status: recentDuplicate.status,
            createdAt: recentDuplicate.createdAt,
            source: recentDuplicate.source,
          },
        },
        { status: 201 }
      );
    }

    // Create lead record in tenant scope
    const lead = db.createLead({
      tenantId,
      name: name.trim(),
      phone: phone.trim(),
      email: email && typeof email === 'string' ? email.trim() : undefined,
      source: sanitizedSource as 'REGISTER' | 'TRIAL' | 'CONTACT',
      selectedPackage: selectedPackage || undefined,
      packageId: packageId || undefined,
      preferredDate: preferredDate || undefined,
      interest: interest || selectedPackage || undefined,
      message: message ? String(message).trim() : undefined,
    });

    // Zero internal data leakage: return only safe lead confirmation reference
    return NextResponse.json(
      {
        success: true,
        lead: {
          id: lead.id,
          status: lead.status,
          createdAt: lead.createdAt,
          source: lead.source,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit lead';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// GET /api/leads - Staff Follow-Up Queue (Authorized Staff Only)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'tenant-1';

  // Server-side authorization check: Only authorized staff (SUPER_ADMIN, OWNER, GENERAL_MANAGER, RECEPTIONIST)
  const auth = authorizeServerRequest(request, 'MEMBER_PROFILE_MANAGE', 'VIEW', tenantId);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const leads = db.getLeads(tenantId);
  return NextResponse.json({ success: true, leads });
}

// PATCH /api/leads - Update Lead Status & Follow-Up Notes (Authorized Staff Only)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';

    // Server-side authorization check: Staff with member profile manage permissions
    const auth = authorizeServerRequest(request, 'MEMBER_PROFILE_MANAGE', 'CREATE_UPDATE', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id, status, notes } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (status) {
      if (!['NEW', 'CONTACTED', 'CONVERTED'].includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid lead status' }, { status: 400 });
      }
      updates.status = status;
    }
    if (notes !== undefined) {
      updates.notes = String(notes);
    }

    const updated = db.updateLead(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // Audit log if converted
    if (status === 'CONVERTED') {
      db.recordAuditEvent({
        tenantId,
        actorId: auth.user!.id,
        actorName: auth.user!.name,
        actorRole: auth.user!.role,
        action: 'MEMBER_CREATE',
        entityType: 'MEMBER',
        entityId: updated.id,
        details: `Converted lead '${updated.name}' into registered member pipeline`,
      });
    }

    return NextResponse.json({ success: true, lead: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update lead';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/leads - Remove Lead (Manager/Owner Only)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const tenantId = body.tenantId || searchParams.get('tenantId') || 'tenant-1';
    const id = body.id || searchParams.get('id');

    // Only OWNER and GENERAL_MANAGER can delete leads
    const auth = authorizeServerRequest(request, 'MEMBER_PROFILE_MANAGE', 'MANAGE', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 });
    }

    const deleted = db.deleteLead(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete lead';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
