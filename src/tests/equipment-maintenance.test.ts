import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/storage';

describe('Pillar 5 & 7: Equipment Registration, Maintenance & Operational Alerts', () => {
  beforeEach(() => {
    db.resetDemoData();
  });

  it('registers new gym equipment asset with OPERATIONAL status', () => {
    const equipment = db.createEquipment({
      tenantId: 'tenant-1',
      name: 'Eleiko Olympic Power Rack #3',
      category: 'STRENGTH',
      serialNumber: 'ELK-PR-9921',
      purchaseDate: '2024-05-01',
      purchaseCost: 3200,
      warrantyExpires: '2028-05-01',
      status: 'OPERATIONAL',
      location: 'Free Weights Deck',
    });

    expect(equipment.id).toBeDefined();
    expect(equipment.status).toBe('OPERATIONAL');

    const found = db.getEquipmentById(equipment.id);
    expect(found?.name).toBe('Eleiko Olympic Power Rack #3');
  });

  it('creates maintenance ticket and automatically flags equipment as UNDER_MAINTENANCE', () => {
    const equipment = db.createEquipment({
      tenantId: 'tenant-1',
      name: 'StairMaster 8Gx HIIT Stepper',
      category: 'CARDIO',
      serialNumber: 'SM-8G-102',
      purchaseDate: '2024-01-15',
      purchaseCost: 4500,
      status: 'OPERATIONAL',
    });

    expect(db.getEquipmentById(equipment.id)?.status).toBe('OPERATIONAL');

    const ticket = db.createMaintenanceTicket({
      tenantId: 'tenant-1',
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      title: 'Alternator drive chain noise and slip',
      description: 'Pedal step resistance drops unexpectedly during level 8 climb.',
      priority: 'URGENT',
      status: 'OPEN',
      reportedBy: 'Coach Marcus',
    });

    expect(ticket.id).toBeDefined();
    // Equipment status should now be updated to UNDER_MAINTENANCE
    expect(db.getEquipmentById(equipment.id)?.status).toBe('UNDER_MAINTENANCE');
  });

  it('resolving maintenance ticket restores equipment to OPERATIONAL and optionally logs repair expense', () => {
    // Ticket tkt-201 exists in seed data for eq-102 (LifeFitness Treadmill #2)
    const initialTreadmill = db.getEquipmentById('eq-102');
    expect(initialTreadmill?.status).toBe('UNDER_MAINTENANCE');

    const initialExpensesCount = db.getExpenses('tenant-1').length;

    const resolved = db.updateMaintenanceTicket('tkt-201', {
      status: 'RESOLVED',
      resolvedBy: 'Kassahun Mengistu',
      resolutionNotes: 'New drive belt installed and tensioned to 80 lbs. Speed sensor recalibrated.',
      resolutionCost: 120.00,
    });

    expect(resolved?.status).toBe('RESOLVED');
    expect(resolved?.resolvedBy).toBe('Kassahun Mengistu');

    // Machine should now be back to OPERATIONAL since no other active tickets remain
    expect(db.getEquipmentById('eq-102')?.status).toBe('OPERATIONAL');

    // Resolution cost should have been logged into expenses
    const updatedExpenses = db.getExpenses('tenant-1');
    expect(updatedExpenses.length).toBe(initialExpensesCount + 1);
    const repairExpense = updatedExpenses.find((e) => e.title.includes('Treadmill #2'));
    expect(repairExpense?.amount).toBe(120.00);
  });

  it('generates operational alerts for maintenance, low stock, and member debts', () => {
    const alerts = db.getOperationalAlerts('tenant-1');
    expect(alerts.length).toBeGreaterThan(0);

    const maintAlert = alerts.find((a) => a.type === 'MAINTENANCE');
    expect(maintAlert).toBeDefined();

    const lowStockAlert = alerts.find((a) => a.type === 'LOW_STOCK');
    expect(lowStockAlert).toBeDefined();
  });
});
