import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/storage';

describe('Pillar 3: Expenses and Profit & Loss Calculation', () => {
  beforeEach(() => {
    db.resetDemoData();
  });

  it('calculates gross revenue, total expenses, and net profit correctly', () => {
    const pnl = db.getProfitLossSummary('tenant-1');

    expect(pnl.grossRevenue).toBeGreaterThan(0);
    expect(pnl.totalExpenses).toBeGreaterThan(0);
    expect(pnl.netProfit).toBe(pnl.grossRevenue - pnl.totalExpenses);
    expect(pnl.categoryExpenses.UTILITIES).toBeGreaterThan(0);
    expect(pnl.categoryExpenses.PAYROLL).toBeGreaterThan(0);
  });

  it('logs a new expense and immediately updates net profit calculation', () => {
    const initialPnl = db.getProfitLossSummary('tenant-1');
    const initialExpensesCount = db.getExpenses('tenant-1').length;

    const newExpense = db.createExpense({
      tenantId: 'tenant-1',
      title: 'Emergency Generator Diesel Refill',
      category: 'UTILITIES',
      amount: 250.00,
      paymentMethod: 'CASH',
      vendor: 'TotalEnergies Station',
      date: new Date().toISOString(),
      loggedBy: 'Dawit Bekele',
      notes: 'Backup power fueling for cardio floor',
    });

    expect(newExpense.id).toBeDefined();
    expect(db.getExpenses('tenant-1').length).toBe(initialExpensesCount + 1);

    const updatedPnl = db.getProfitLossSummary('tenant-1');
    expect(updatedPnl.totalExpenses).toBe(initialPnl.totalExpenses + 250.00);
    expect(updatedPnl.netProfit).toBe(initialPnl.netProfit - 250.00);
  });

  it('filters expenses by category accurately', () => {
    const utilityExpenses = db.getExpenses('tenant-1', { category: 'UTILITIES' });
    expect(utilityExpenses.length).toBeGreaterThan(0);
    expect(utilityExpenses.every((e) => e.category === 'UTILITIES')).toBe(true);

    const payrollExpenses = db.getExpenses('tenant-1', { category: 'PAYROLL' });
    expect(payrollExpenses.every((e) => e.category === 'PAYROLL')).toBe(true);
  });
});
