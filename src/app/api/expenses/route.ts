import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { ExpenseCategory, ExpenseStatus } from '@/lib/types';
import { authorizeServerRequest } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'tenant-1';

  // Server authorization check: Role must have permission to view expenses (blocked for MAINTENANCE_STAFF, TRAINER, RECEPTIONIST, MEMBER)
  const auth = authorizeServerRequest(request, 'RECORD_APPROVE_EXPENSES', 'VIEW', tenantId);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const category = searchParams.get('category') || undefined;
  const status = searchParams.get('status') as ExpenseStatus | undefined;
  const search = searchParams.get('search')?.toLowerCase() || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const summary = searchParams.get('summary') === 'true';

  if (summary) {
    const pnl = db.getProfitLossSummary(tenantId);
    return NextResponse.json({ success: true, summary: pnl });
  }

  let expenses = db.getExpenses(tenantId, { category, startDate, endDate });

  if (status && status !== ('ALL' as any)) {
    expenses = expenses.filter((e) => e.status === status);
  }

  if (search) {
    expenses = expenses.filter(
      (e) =>
        e.title.toLowerCase().includes(search) ||
        e.vendor.toLowerCase().includes(search) ||
        (e.notes && e.notes.toLowerCase().includes(search))
    );
  }

  return NextResponse.json({ success: true, expenses });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-1',
      title,
      category,
      amount,
      paymentMethod = 'CASH',
      vendor,
      date,
      loggedBy = 'Staff',
      notes,
      evidenceUrl,
      status = 'PENDING_APPROVAL',
    } = body;

    // Server authorization check: Role must be able to record/approve expenses (OWNER, GENERAL_MANAGER, MANAGER, FINANCE_OFFICER)
    const auth = authorizeServerRequest(request, 'RECORD_APPROVE_EXPENSES', 'CREATE_UPDATE', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (!title || !category || amount === undefined || !vendor) {
      return NextResponse.json(
        { success: false, error: 'Missing required expense fields (title, category, amount, vendor)' },
        { status: 400 }
      );
    }

    const expense = db.createExpense({
      tenantId,
      title,
      category: category as ExpenseCategory,
      amount: parseFloat(amount),
      paymentMethod,
      vendor,
      date: date || new Date().toISOString(),
      loggedBy: loggedBy || auth.user!.name,
      notes,
      evidenceUrl,
      status: status as ExpenseStatus,
    });

    // Record immutable audit event for protected mutation
    db.recordAuditEvent({
      tenantId,
      actorId: auth.user!.id,
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      action: 'EXPENSE_RECORDED',
      entityType: 'EXPENSE',
      entityId: expense.id,
      details: `Recorded expense '${expense.title}' (${expense.category}) for ${expense.amount} to vendor '${expense.vendor}' [Status: ${expense.status}]`,
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, tenantId = 'tenant-1', reason } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Expense ID is required' }, { status: 400 });
    }

    // Role check: Approvals and voids require MANAGE level (OWNER, GENERAL_MANAGER, MANAGER, FINANCE_OFFICER)
    const auth = authorizeServerRequest(request, 'RECORD_APPROVE_EXPENSES', 'MANAGE', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (action === 'APPROVE') {
      const result = db.approveExpense(
        tenantId,
        id,
        { id: auth.user!.id, name: auth.user!.name, role: auth.user!.role }
      );
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.message || 'Failed to approve expense' },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: true, expense: result.expense });
    }

    if (action === 'REJECT') {
      if (!reason) {
        return NextResponse.json({ success: false, error: 'Reason is required to reject an expense' }, { status: 400 });
      }
      const result = db.rejectExpense(
        tenantId,
        id,
        { id: auth.user!.id, name: auth.user!.name, role: auth.user!.role },
        reason
      );
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, expense: result.expense });
    }

    if (action === 'VOID') {
      if (!reason) {
        return NextResponse.json({ success: false, error: 'Reason is required to void an expense record' }, { status: 400 });
      }
      const result = db.voidExpense(
        tenantId,
        id,
        { id: auth.user!.id, name: auth.user!.name, role: auth.user!.role },
        reason
      );
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, expense: result.expense });
    }

    return NextResponse.json({ success: false, error: 'Invalid expense action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const tenantId = searchParams.get('tenantId') || 'tenant-1';
  const reason = searchParams.get('reason') || 'Voided via API request';

  // Server authorization check: Only OWNER, GENERAL_MANAGER, MANAGER, or FINANCE_OFFICER can void
  const auth = authorizeServerRequest(request, 'RECORD_APPROVE_EXPENSES', 'MANAGE', tenantId);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!id) {
    return NextResponse.json({ success: false, error: 'Expense ID is required' }, { status: 400 });
  }

  try {
    // Non-destructive voiding to maintain complete financial audit trail
    const result = db.voidExpense(
      tenantId,
      id,
      { id: auth.user!.id, name: auth.user!.name, role: auth.user!.role },
      reason
    );
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message || 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      message: 'Expense record voided successfully with audit log',
      expense: result.expense,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Expense not found' }, { status: 404 });
  }
}
