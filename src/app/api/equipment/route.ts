import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { authorizeServerRequest } from '@/lib/rbac';
import { EquipmentCondition, EquipmentStatus, TicketPriority, TicketSeverity } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'tenant-1';
  const type = searchParams.get('type') || 'all';

  // Check authorization if user session is present
  const auth = authorizeServerRequest(request, 'ASSETS_MAINTENANCE', 'VIEW', tenantId);
  if (!auth.authorized && auth.status === 403) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  if (type === 'alerts') {
    const alerts = db.getOperationalAlerts(tenantId);
    return NextResponse.json({ success: true, alerts });
  }

  if (type === 'leads') {
    const leads = db.getLeads(tenantId);
    return NextResponse.json({ success: true, leads });
  }

  let equipment = db.getEquipment(tenantId);
  let tickets = db.getMaintenanceTickets(tenantId);
  const alerts = db.getOperationalAlerts(tenantId);

  // Search & Filters for Assets
  const search = searchParams.get('search')?.toLowerCase();
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const condition = searchParams.get('condition');

  if (search) {
    equipment = equipment.filter(
      (e) =>
        e.name.toLowerCase().includes(search) ||
        (e.serialNumber && e.serialNumber.toLowerCase().includes(search)) ||
        (e.location && e.location.toLowerCase().includes(search)) ||
        e.category.toLowerCase().includes(search) ||
        (e.condition && e.condition.toLowerCase().includes(search))
    );
  }

  if (category && category !== 'ALL') {
    equipment = equipment.filter((e) => e.category.toLowerCase() === category.toLowerCase());
  }

  if (status && status !== 'ALL') {
    equipment = equipment.filter((e) => e.status === status);
  }

  if (condition && condition !== 'ALL') {
    equipment = equipment.filter((e) => e.condition === condition);
  }

  return NextResponse.json({
    success: true,
    equipment,
    tickets,
    alerts,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'CREATE_EQUIPMENT', tenantId = 'tenant-1' } = body;

    if (action === 'CREATE_EQUIPMENT') {
      const auth = authorizeServerRequest(request, 'ASSETS_MAINTENANCE', 'MANAGE', tenantId);
      if (!auth.authorized) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
      }

      const {
        name,
        category,
        serialNumber,
        purchaseDate,
        purchaseCost,
        warrantyExpires,
        status = 'OPERATIONAL',
        condition = 'GOOD',
        location,
        lastServicedAt,
        nextServiceDue,
      } = body;

      if (!name || !category || !serialNumber || !purchaseDate || purchaseCost === undefined) {
        return NextResponse.json(
          { success: false, error: 'Missing required equipment fields (name, category, serialNumber, purchaseDate, purchaseCost)' },
          { status: 400 }
        );
      }

      const item = db.createEquipment({
        tenantId,
        name,
        category,
        serialNumber,
        purchaseDate,
        purchaseCost: parseFloat(purchaseCost),
        warrantyExpires,
        status: status as EquipmentStatus,
        condition: condition as EquipmentCondition,
        location,
        lastServicedAt,
        nextServiceDue,
      });

      db.recordAuditEvent({
        tenantId,
        actorId: auth.user!.id,
        actorName: auth.user!.name,
        actorRole: auth.user!.role,
        action: 'EQUIPMENT_CREATED',
        entityType: 'EQUIPMENT',
        entityId: item.id,
        details: `Created equipment asset '${item.name}' (S/N: ${item.serialNumber}) in '${item.location || 'General'}'`,
      });

      return NextResponse.json({ success: true, equipment: item }, { status: 201 });
    }

    if (action === 'CREATE_TICKET') {
      const auth = authorizeServerRequest(request, 'ASSETS_MAINTENANCE', 'CREATE_UPDATE', tenantId);
      if (!auth.authorized) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
      }

      const {
        equipmentId,
        equipmentName,
        title,
        description,
        priority = 'MEDIUM',
        severity = 'ROUTINE_SERVICE',
        assigneeId,
        assigneeName,
        photoUrl,
        expectedCost,
        reportedBy = auth.user?.name || 'Staff',
      } = body;

      if (!equipmentId || !title || !description) {
        return NextResponse.json(
          { success: false, error: 'Missing required maintenance ticket fields (equipmentId, title, description)' },
          { status: 400 }
        );
      }

      const ticket = db.createMaintenanceTicket({
        tenantId,
        equipmentId,
        equipmentName: equipmentName || 'Equipment Asset',
        title,
        description,
        priority: priority as TicketPriority,
        severity: severity as TicketSeverity,
        assigneeId,
        assigneeName,
        photoUrl,
        expectedCost: expectedCost ? parseFloat(expectedCost) : undefined,
        status: 'OPEN',
        reportedBy,
      });

      return NextResponse.json({ success: true, ticket }, { status: 201 });
    }

    if (action === 'CREATE_LEAD') {
      const { name, phone, email, preferredDate, interest } = body;
      if (!name || !phone) {
        return NextResponse.json(
          { success: false, error: 'Name and phone are required to book a trial session' },
          { status: 400 }
        );
      }

      const lead = db.createLead({
        tenantId,
        name,
        phone,
        email,
        preferredDate,
        interest,
      });

      return NextResponse.json({ success: true, lead }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, tenantId = 'tenant-1', ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Target ID is required' }, { status: 400 });
    }

    if (action === 'RESOLVE_TICKET') {
      const auth = authorizeServerRequest(request, 'ASSETS_MAINTENANCE', 'CREATE_UPDATE', tenantId);
      if (!auth.authorized) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
      }

      const { resolvedBy = auth.user?.name || 'Technician', resolutionNotes, resolutionCost, nextServiceDue } = updates;
      const resolved = db.updateMaintenanceTicket(id, {
        status: 'RESOLVED',
        resolvedAt: new Date().toISOString(),
        resolvedBy,
        resolutionNotes,
        resolutionCost: resolutionCost ? parseFloat(resolutionCost) : undefined,
      });

      if (!resolved) {
        return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, ticket: resolved });
    }

    if (action === 'UPDATE_TICKET') {
      const auth = authorizeServerRequest(request, 'ASSETS_MAINTENANCE', 'CREATE_UPDATE', tenantId);
      if (!auth.authorized) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
      }

      const updated = db.updateMaintenanceTicket(id, updates);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, ticket: updated });
    }

    if (action === 'UPDATE_EQUIPMENT') {
      const auth = authorizeServerRequest(request, 'ASSETS_MAINTENANCE', 'MANAGE', tenantId);
      if (!auth.authorized) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
      }

      const updated = db.updateEquipment(id, updates);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Equipment not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, equipment: updated });
    }

    if (action === 'UPDATE_LEAD') {
      const updated = db.updateLeadStatus(id, updates.status);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, lead: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
