import { NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { authorizeServerRequest } from '@/lib/rbac';
import { PaymentMethod } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'tenant-1';
  const type = searchParams.get('type') || 'all';
  const memberId = searchParams.get('memberId') || undefined;
  const receiptNumber = searchParams.get('receiptNumber') || undefined;

  // Authorization check
  const auth = authorizeServerRequest(request, 'RECORD_PAYMENT_RECEIPT', 'VIEW', tenantId);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (receiptNumber) {
    const receipt = db.getReceiptByNumber(tenantId, receiptNumber);
    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }
    return NextResponse.json({ receipt });
  }

  if (type === 'receipts') {
    const receipts = db.getReceipts(tenantId, memberId);
    return NextResponse.json({ receipts });
  }

  if (type === 'corrections') {
    const corrections = db.getFinancialCorrections(tenantId);
    return NextResponse.json({ corrections });
  }

  if (type === 'products') {
    const products = db.getProducts(tenantId);
    return NextResponse.json({ products });
  }

  const invoices = db.getInvoices(tenantId, memberId);
  const products = db.getProducts(tenantId);
  const receipts = db.getReceipts(tenantId, memberId);
  return NextResponse.json({ invoices, products, receipts });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';

    // 1. Record payment on existing invoice
    if (body.action === 'RECORD_PAYMENT') {
      const auth = authorizeServerRequest(request, 'RECORD_PAYMENT_RECEIPT', 'CREATE_UPDATE', tenantId);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }

      if (!body.invoiceId || !body.amount) {
        return NextResponse.json({ error: 'Invoice ID and payment amount are required' }, { status: 400 });
      }

      const result = db.recordPayment(tenantId, body.invoiceId, {
        amount: Number(body.amount),
        paymentMethod: (body.paymentMethod as PaymentMethod) || 'CASH',
        paymentReference: body.paymentReference,
        notes: body.notes,
        actor: auth.user ? { id: auth.user.id, name: auth.user.name, role: auth.user.role } : undefined,
      });

      return NextResponse.json(result, { status: 200 });
    }

    // 2. Void Invoice (Requires VOID_REFUND_TRANSACTION permission: Owner, Manager, Finance Officer only)
    if (body.action === 'VOID_INVOICE') {
      const auth = authorizeServerRequest(request, 'VOID_REFUND_TRANSACTION', 'MANAGE', tenantId);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }

      if (!body.invoiceId || !body.reason) {
        return NextResponse.json({ error: 'Invoice ID and void reason are required' }, { status: 400 });
      }

      const result = db.voidInvoice(
        tenantId,
        body.invoiceId,
        body.reason,
        auth.user!
      );

      return NextResponse.json(result, { status: 200 });
    }

    // 3. Refund Payment (Requires VOID_REFUND_TRANSACTION permission)
    if (body.action === 'REFUND_TRANSACTION') {
      const auth = authorizeServerRequest(request, 'VOID_REFUND_TRANSACTION', 'MANAGE', tenantId);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }

      if (!body.invoiceId || !body.amount || !body.reason) {
        return NextResponse.json({ error: 'Invoice ID, refund amount, and reason are required' }, { status: 400 });
      }

      const result = db.refundInvoice(
        tenantId,
        body.invoiceId,
        Number(body.amount),
        body.reason,
        auth.user!
      );

      return NextResponse.json(result, { status: 200 });
    }

    // 4. Adjust Member Balance
    if (body.action === 'ADJUST_BALANCE') {
      const auth = authorizeServerRequest(request, 'RECORD_PAYMENT_RECEIPT', 'MANAGE', tenantId);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }

      if (!body.memberId || body.amount === undefined || !body.reason) {
        return NextResponse.json({ error: 'Member ID, adjustment amount, and reason are required' }, { status: 400 });
      }

      const result = db.adjustBalance(
        tenantId,
        body.memberId,
        Number(body.amount),
        body.reason,
        auth.user!
      );

      return NextResponse.json(result, { status: 200 });
    }

    // Product actions
    if (body.action === 'CREATE_PRODUCT') {
      const auth = authorizeServerRequest(request, 'CONFIG_BUSINESS_PACKAGES', 'MANAGE', tenantId);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }

      const product = db.createProduct(tenantId, {
        name: body.name,
        category: body.category || 'DRINK',
        price: Number(body.price),
        stock: Number(body.stock) || 0,
        sku: body.sku || `SKU-${Date.now()}`,
      });
      return NextResponse.json({ product }, { status: 201 });
    }

    if (body.action === 'UPDATE_PRODUCT') {
      const auth = authorizeServerRequest(request, 'CONFIG_BUSINESS_PACKAGES', 'MANAGE', tenantId);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }

      const product = db.updateProduct(tenantId, body.id, body.updates);
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ product });
    }

    if (body.action === 'DELETE_PRODUCT') {
      const auth = authorizeServerRequest(request, 'CONFIG_BUSINESS_PACKAGES', 'MANAGE', tenantId);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }

      const success = db.deleteProduct(tenantId, body.id);
      if (!success) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Product deleted' });
    }

    // Process POS sale
    if (body.items && Array.isArray(body.items)) {
      const auth = authorizeServerRequest(request, 'RECORD_PAYMENT_RECEIPT', 'CREATE_UPDATE', tenantId);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }

      const sale = db.processSale(
        tenantId,
        body.items,
        body.paymentMethod || 'CASH',
        body.memberId,
        body.cashierName || auth.user?.name || 'Front Desk'
      );
      return NextResponse.json({ sale }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid billing action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Billing action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
