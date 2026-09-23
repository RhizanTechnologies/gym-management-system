import { NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { getAuthenticatedUser } from '@/lib/rbac';
import { NotificationStatus, NotificationType, User } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-1';
    const branchId = searchParams.get('branchId') || undefined;
    const status = (searchParams.get('status') as NotificationStatus) || undefined;
    const type = (searchParams.get('type') as NotificationType) || undefined;

    const logs = db.getNotificationLogs(tenantId, { branchId, status, type });
    const settings = db.getNotificationSettings(tenantId);

    const stats = {
      total: logs.length,
      sent: logs.filter((l) => l.status === 'SENT').length,
      failed: logs.filter((l) => l.status === 'FAILED').length,
      optedOut: logs.filter((l) => l.status === 'OPTED_OUT').length,
      pending: logs.filter((l) => l.status === 'PENDING' || l.status === 'QUEUED').length,
    };

    return NextResponse.json({
      success: true,
      logs,
      settings,
      stats,
    });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';
    const action = body.action || 'DISPATCH'; // 'DISPATCH' | 'RETRY'

    const authUser = getAuthenticatedUser(request);
    const actor: User = authUser
      ? {
          id: authUser.id,
          tenantId: authUser.tenantId,
          name: authUser.name,
          email: authUser.email,
          role: authUser.role,
          isActive: authUser.isActive,
          createdAt: new Date().toISOString(),
        }
      : {
          id: 'system-actor',
          tenantId,
          name: 'System Dispatcher',
          email: 'system@apexfitness.et',
          role: 'OWNER',
          isActive: true,
          createdAt: new Date().toISOString(),
        };

    if (action === 'DISPATCH') {
      const branchId = body.branchId;
      const previewOnly = Boolean(body.previewOnly);

      const result = db.dispatchNotifications(tenantId, actor, { previewOnly, branchId });
      return NextResponse.json({
        success: true,
        action: 'DISPATCH',
        previewOnly,
        dispatchedCount: result.dispatchedCount,
        optedOutCount: result.optedOutCount,
        failedCount: result.failedCount,
        logs: result.logs,
      });
    }

    if (action === 'RETRY') {
      const notificationId = body.notificationId;
      if (!notificationId) {
        return NextResponse.json(
          { success: false, error: 'Missing notificationId for retry.' },
          { status: 400 }
        );
      }

      try {
        const retriedLog = db.retryNotification(tenantId, notificationId, actor);
        return NextResponse.json({
          success: true,
          action: 'RETRY',
          log: retriedLog,
          message: 'Notification retry executed successfully.',
        });
      } catch (retryError: any) {
        return NextResponse.json(
          {
            success: false,
            action: 'RETRY',
            error: retryError.message || 'Retry failed.',
            isLimitExceeded: retryError.message?.includes('Maximum retry limit'),
            isOptedOut: retryError.message?.includes('opted out'),
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: `Invalid action: '${action}'. Expected 'DISPATCH' or 'RETRY'.` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Error handling notification POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';
    const settingsUpdates = body.settings || {};

    const authUser = getAuthenticatedUser(request);
    const actor: User = authUser
      ? {
          id: authUser.id,
          tenantId: authUser.tenantId,
          name: authUser.name,
          email: authUser.email,
          role: authUser.role,
          isActive: authUser.isActive,
          createdAt: new Date().toISOString(),
        }
      : {
          id: 'user-owner-1',
          tenantId,
          name: 'Dawit Bekele',
          email: 'owner@apexfitness.et',
          role: 'OWNER',
          isActive: true,
          createdAt: new Date().toISOString(),
        };

    const updatedSettings = db.updateNotificationSettings(tenantId, settingsUpdates, actor);

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
    });
  } catch (err: any) {
    console.error('Error updating notification settings:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
