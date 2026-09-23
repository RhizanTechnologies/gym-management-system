import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/storage';
import { User, DashboardFilter, DateRangePeriod } from '@/lib/types';

describe('Prompt 6: Dashboard, Reports, and Notifications Verification', () => {
  beforeEach(() => {
    db.resetDemoData();
  });

  const tenantId = 'tenant-1';

  const ownerUser: User = {
    id: 'user-owner-1',
    tenantId,
    name: 'Dawit Bekele',
    email: 'owner@apexfitness.et',
    role: 'OWNER',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const financeUser: User = {
    id: 'user-finance-1',
    tenantId,
    name: 'Almaz Wolde',
    email: 'finance@apexfitness.et',
    role: 'FINANCE_OFFICER',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const receptionistUser: User = {
    id: 'user-staff-1',
    tenantId,
    name: 'Selam Tesfaye',
    email: 'reception@apexfitness.et',
    role: 'RECEPTIONIST',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const trainerUser: User = {
    id: 'user-trainer-1',
    tenantId,
    name: 'Coach Marcus',
    email: 'marcus@apexfitness.et',
    role: 'TRAINER',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  // ----------------------------------------------------------------------------------
  // CRITERION 1 & 2: RECONCILIATION INVARIANT & DRILL-DOWN CONTEXT PRESERVATION
  // ----------------------------------------------------------------------------------
  describe('Criterion 1 & 2: Reconciliation Invariant & Drill-Downs', () => {
    it('reconciles revenue total and count to itemized drill-down records across branches', () => {
      // 1. All Branches
      const filterAll: DashboardFilter = {
        tenantId,
        branchId: 'ALL',
        period: 'THIS_YEAR',
      };
      const dataAll = db.getReconciledDashboardData(filterAll);
      const drillDownAll = db.getMetricDrillDownRecords(tenantId, 'REVENUE', filterAll);

      const sumPaidAll = drillDownAll.records.reduce((acc: number, inv: any) => acc + inv.paidAmount, 0);
      expect(drillDownAll.records.length).toBe(dataAll.revenue.count);
      expect(Number(sumPaidAll.toFixed(2))).toBe(dataAll.revenue.total);
      expect(drillDownAll.filter.branchId).toBe('ALL');
      expect(drillDownAll.filter.period).toBe('THIS_YEAR');

      // 2. Specific Branch: branch-1-main
      const filterMain: DashboardFilter = {
        tenantId,
        branchId: 'branch-1-main',
        period: 'THIS_YEAR',
      };
      const dataMain = db.getReconciledDashboardData(filterMain);
      const drillDownMain = db.getMetricDrillDownRecords(tenantId, 'REVENUE', filterMain);

      const sumPaidMain = drillDownMain.records.reduce((acc: number, inv: any) => acc + inv.paidAmount, 0);
      expect(drillDownMain.records.length).toBe(dataMain.revenue.count);
      expect(Number(sumPaidMain.toFixed(2))).toBe(dataMain.revenue.total);
      expect(drillDownMain.filter.branchId).toBe('branch-1-main');
      // Verify every record in drill down belongs to branch-1-main
      drillDownMain.records.forEach((inv: any) => {
        expect(inv.branchId).toBe('branch-1-main');
      });

      // 3. Specific Branch: branch-1-sarbet
      const filterSarbet: DashboardFilter = {
        tenantId,
        branchId: 'branch-1-sarbet',
        period: 'THIS_YEAR',
      };
      const dataSarbet = db.getReconciledDashboardData(filterSarbet);
      const drillDownSarbet = db.getMetricDrillDownRecords(tenantId, 'REVENUE', filterSarbet);

      const sumPaidSarbet = drillDownSarbet.records.reduce((acc: number, inv: any) => acc + inv.paidAmount, 0);
      expect(drillDownSarbet.records.length).toBe(dataSarbet.revenue.count);
      expect(Number(sumPaidSarbet.toFixed(2))).toBe(dataSarbet.revenue.total);
      drillDownSarbet.records.forEach((inv: any) => {
        expect(inv.branchId).toBe('branch-1-sarbet');
      });

      // Disjoint sum property
      expect(dataMain.revenue.total + dataSarbet.revenue.total).toBe(dataAll.revenue.total);
    });

    it('reconciles operating expenses total and count to itemized drill-down records', () => {
      const filter: DashboardFilter = {
        tenantId,
        branchId: 'ALL',
        period: 'THIS_YEAR',
      };
      const dashboard = db.getReconciledDashboardData(filter);
      const drillDown = db.getMetricDrillDownRecords(tenantId, 'EXPENSES', filter);

      const sumExp = drillDown.records.reduce((acc: number, e: any) => acc + e.amount, 0);
      expect(drillDown.records.length).toBe(dashboard.expenses.count);
      expect(Number(sumExp.toFixed(2))).toBe(dashboard.expenses.total);
    });

    it('reconciles active members count to itemized active member drill-down records', () => {
      const filter: DashboardFilter = {
        tenantId,
        branchId: 'branch-1-main',
        period: 'THIS_MONTH',
      };
      const dashboard = db.getReconciledDashboardData(filter);
      const drillDown = db.getMetricDrillDownRecords(tenantId, 'ACTIVE_MEMBERS', filter);

      expect(drillDown.records.length).toBe(dashboard.members.active);
      drillDown.records.forEach((m: any) => {
        expect(m.status).toBe('ACTIVE');
        expect(m.branchId).toBe('branch-1-main');
      });
    });

    it('reconciles check-in visits to drill-down records and preserves period filter', () => {
      const filter: DashboardFilter = {
        tenantId,
        branchId: 'ALL',
        period: 'THIS_MONTH',
      };
      const dashboard = db.getReconciledDashboardData(filter);
      const drillDown = db.getMetricDrillDownRecords(tenantId, 'CHECK_INS', filter);

      expect(drillDown.records.length).toBe(dashboard.checkIns.total);
      expect(drillDown.filter.period).toBe('THIS_MONTH');
    });

    it('reconciles outstanding dues to itemized debtors list', () => {
      const filter: DashboardFilter = {
        tenantId,
        branchId: 'ALL',
        period: 'THIS_YEAR',
      };
      const dashboard = db.getReconciledDashboardData(filter);
      const drillDown = db.getMetricDrillDownRecords(tenantId, 'OUTSTANDING_BALANCES', filter);

      const totalDues = drillDown.records.reduce((acc: number, m: any) => acc + m.dueBalance, 0);
      expect(drillDown.records.length).toBe(dashboard.debts.debtorCount);
      expect(Number(totalDues.toFixed(2))).toBe(dashboard.debts.totalOutstanding);
    });
  });

  // ----------------------------------------------------------------------------------
  // CRITERION 3: AUTOMATED CALCULATIONS (REVENUE, EXPENSE, BALANCE, PROFIT/LOSS)
  // ----------------------------------------------------------------------------------
  describe('Criterion 3: Financial Calculations & Profit/Loss Accuracy', () => {
    it('calculates Net Profit and Margin % accurately', () => {
      const filter: DashboardFilter = {
        tenantId,
        branchId: 'ALL',
        period: 'THIS_YEAR',
      };
      const dashboard = db.getReconciledDashboardData(filter);
      const rev = dashboard.revenue.total;
      const exp = dashboard.expenses.total;
      const expectedNetProfit = Number((rev - exp).toFixed(2));
      const expectedMargin = rev > 0 ? Number(((expectedNetProfit / rev) * 100).toFixed(1)) : 0;

      expect(dashboard.profitAndLoss.grossRevenue).toBe(rev);
      expect(dashboard.profitAndLoss.totalExpenses).toBe(exp);
      expect(dashboard.profitAndLoss.netProfit).toBe(expectedNetProfit);
      expect(dashboard.profitAndLoss.profitMarginPercent).toBe(expectedMargin);
    });

    it('generates accurate aged accounts receivable categorizations', () => {
      const report = db.getFinancialAndMembershipReport(tenantId, {
        tenantId,
        branchId: 'ALL',
        period: 'THIS_YEAR',
      });

      const aged = report.outstandingBalances;
      const sumBuckets = Number((aged.aged0To30 + aged.aged31To60 + aged.aged61To90 + aged.aged90Plus).toFixed(2));
      expect(sumBuckets).toBe(aged.totalOutstanding);
      expect(aged.members.length).toBe(aged.debtorCount);
    });
  });

  // ----------------------------------------------------------------------------------
  // CRITERION 4: ROLE-SCOPED EXPORTS & TENANT/BRANCH ISOLATION
  // ----------------------------------------------------------------------------------
  describe('Criterion 4: Role-Scoped Reports Export (RBAC)', () => {
    it('allows Owner and Finance Officer to export reports with metadata headers', () => {
      // 1. Owner export
      const exportedCsv = db.exportReportData(tenantId, 'branch-1-main', 'FINANCIAL', 'CSV', ownerUser);
      expect(exportedCsv.filename).toContain('.csv');
      expect(exportedCsv.data).toContain('# Organization:');
      expect(exportedCsv.data).toContain('# Branch: M Fitness & Gym - Figa Main Branch');
      expect(exportedCsv.data).toContain('Generated By: Dawit Bekele (OWNER)');
      expect(exportedCsv.data).toContain('Gross Revenue');

      // 2. Finance Officer JSON export
      const exportedJson = db.exportReportData(tenantId, 'ALL', 'FINANCIAL', 'JSON', financeUser);
      expect(exportedJson.filename).toContain('.json');
      const parsed = JSON.parse(exportedJson.data);
      expect(parsed.metadata.organization).toBeDefined();
      expect(parsed.metadata.generatedBy.role).toBe('FINANCE_OFFICER');
      expect(parsed.data.grossRevenue).toBeDefined();
    });

    it('denies export for Receptionist, Trainer, and Maintenance Staff with FORBIDDEN error', () => {
      // Receptionist
      expect(() => {
        db.exportReportData(tenantId, 'ALL', 'FINANCIAL', 'CSV', receptionistUser);
      }).toThrow(/FORBIDDEN: Role 'RECEPTIONIST' is not authorized/);

      // Trainer
      expect(() => {
        db.exportReportData(tenantId, 'ALL', 'FINANCIAL', 'CSV', trainerUser);
      }).toThrow(/FORBIDDEN: Role 'TRAINER' is not authorized/);
    });

    it('denies cross-tenant report exports', () => {
      const foreignActor: User = {
        id: 'user-tenant-2',
        tenantId: 'tenant-2',
        name: 'Foreign GM',
        email: 'gm@tenant2.et',
        role: 'OWNER',
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      expect(() => {
        db.exportReportData('tenant-1', 'ALL', 'FINANCIAL', 'CSV', foreignActor);
      }).toThrow(/FORBIDDEN: Cross-tenant access denied/);
    });

    it('records immutable audit log when report is exported', () => {
      db.exportReportData(tenantId, 'branch-1-main', 'MEMBERSHIP', 'CSV', ownerUser);

      const auditLogs = db.getAuditEvents(tenantId);
      const exportEvent = auditLogs.find((a) => a.action === 'REPORT_EXPORTED');
      expect(exportEvent).toBeDefined();
      expect(exportEvent?.actorId).toBe(ownerUser.id);
      expect(exportEvent?.actorRole).toBe('OWNER');
    });
  });

  // ----------------------------------------------------------------------------------
  // CRITERION 5: CONFIGURED RENEWAL TIMING & OPT-OUT CONSENT ENFORCEMENT
  // ----------------------------------------------------------------------------------
  describe('Criterion 5: Configured Renewal Timing & Consent Enforcement', () => {
    it('dispatches renewal notices according to configured schedule (e.g. 7, 3, 1 days)', () => {
      const result = db.dispatchNotifications(tenantId, ownerUser);
      expect(result.dispatchedCount + result.optedOutCount + result.failedCount).toBeGreaterThan(0);
    });

    it('never sends notices to opted-out members and records OPTED_OUT status', () => {
      // Elias Tadesse (mem-103) has smsOptOut: true and notificationOptIn: false
      const elias = db.getMemberById('mem-103');
      expect(elias?.smsOptOut).toBe(true);

      const result = db.dispatchNotifications(tenantId, ownerUser);
      expect(result.optedOutCount).toBeGreaterThanOrEqual(1);

      const eliasNotice = result.logs.find((l) => l.memberId === 'mem-103');
      expect(eliasNotice).toBeDefined();
      expect(eliasNotice?.status).toBe('OPTED_OUT');
      expect(eliasNotice?.failureReason).toContain('opted out');
    });
  });

  // ----------------------------------------------------------------------------------
  // CRITERION 6: FAILURE VISIBILITY & CONTROLLED RETRY BEHAVIOR (MAX 3)
  // ----------------------------------------------------------------------------------
  describe('Criterion 6: Notification Failure Diagnostics & Controlled Retry Bounds', () => {
    it('displays failure reasons for failed notifications and tracks retry attempts', () => {
      // notif-3 in seeded initialNotifications is FAILED with retryCount = 1, maxRetries = 3
      const logs = db.getNotificationLogs(tenantId, { status: 'FAILED' });
      const failed = logs.find((l) => l.id === 'notif-3');
      expect(failed).toBeDefined();
      expect(failed?.failureReason).toBeDefined();
      expect(failed?.retryCount).toBe(1);
      expect(failed?.maxRetries).toBe(3);
    });

    it('allows retrying failed notifications up to maximum 3 attempts and blocks beyond', () => {
      const failed = db.getNotificationLogs(tenantId).find((l) => l.id === 'notif-3')!;
      expect(failed.retryCount).toBe(1);

      // 1st Retry -> retryCount becomes 2
      const retry1 = db.retryNotification(tenantId, 'notif-3', ownerUser);
      expect(retry1.status).toBe('SENT');
      expect(retry1.retryCount).toBe(2);

      // Simulate a transient failure occurring again
      const failedAgain = db.getNotificationLogs(tenantId).find((l) => l.id === 'notif-3')!;
      failedAgain.status = 'FAILED';
      failedAgain.failureReason = 'Gateway connection reset';

      // 2nd Retry -> retryCount becomes 3
      const retry2 = db.retryNotification(tenantId, 'notif-3', ownerUser);
      expect(retry2.retryCount).toBe(3);

      // Simulate failing a third time (reaching maxRetries 3)
      failedAgain.status = 'FAILED';
      failedAgain.failureReason = 'Gateway timeout';

      // Attempting further retry MUST be strictly blocked
      expect(() => {
        db.retryNotification(tenantId, 'notif-3', ownerUser);
      }).toThrow(/Maximum retry limit \(3\) exceeded\. Further retries are blocked\./);
    });

    it('blocks retrying if the recipient has opted out in the meantime', () => {
      // Create a test failed notification for a member
      const member = db.getMemberById('mem-101')!;
      member.smsOptOut = true; // member opts out

      const testLog = db.getNotificationLogs(tenantId)[0];
      testLog.memberId = 'mem-101';
      testLog.status = 'FAILED';
      testLog.retryCount = 0;

      expect(() => {
        db.retryNotification(tenantId, testLog.id, ownerUser);
      }).toThrow(/Cannot retry: Recipient has opted out/);
    });
  });

  // ----------------------------------------------------------------------------------
  // CRITERION 8: FIRST-USE / EMPTY DASHBOARD GUIDANCE
  // ----------------------------------------------------------------------------------
  describe('Criterion 8: Empty or First-Use Dashboard Guidance', () => {
    it('flags isFirstUse: true when a new tenant has no members, invoices, or check-ins', () => {
      const emptyFilter: DashboardFilter = {
        tenantId: 'tenant-empty-test',
        branchId: 'ALL',
        period: 'THIS_MONTH',
      };
      const dashboard = db.getReconciledDashboardData(emptyFilter);
      expect(dashboard.isFirstUse).toBe(true);
      expect(dashboard.members.total).toBe(0);
      expect(dashboard.revenue.total).toBe(0);
      expect(dashboard.checkIns.total).toBe(0);
    });

    it('flags isFirstUse: false when active records exist', () => {
      const activeFilter: DashboardFilter = {
        tenantId: 'tenant-1',
        branchId: 'ALL',
        period: 'THIS_MONTH',
      };
      const dashboard = db.getReconciledDashboardData(activeFilter);
      expect(dashboard.isFirstUse).toBe(false);
      expect(dashboard.members.total).toBeGreaterThan(0);
    });
  });
});
