import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { authorizeServerRequest } from '@/lib/rbac';
import { User } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'tenant-1';

  // Server authorization check: View staff
  const auth = authorizeServerRequest(request, 'STAFF_ROLES_SCHEDULES', 'VIEW', tenantId);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // 1. Live database query when DATABASE_URL is available
  if (process.env.DATABASE_URL && !process.env.VITEST) {
    try {
      const dbUsers = await prisma.user.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });

      const users: User[] = dbUsers.map((u) => ({
        id: u.id,
        tenantId: u.tenantId,
        name: u.name,
        email: u.email,
        role: u.role as any,
        phone: u.phone || undefined,
        avatarUrl: u.avatarUrl || undefined,
        isActive: true,
        status: 'ACTIVE' as const,
        createdAt: u.createdAt.toISOString(),
      }));

      // Keep in-memory cache in sync
      for (const u of users) {
        db.addUser(u);
      }

      return NextResponse.json({ users });
    } catch (e) {
      console.warn('Prisma query failed, falling back to storage:', e);
    }
  }

  const users = db.getUsers(tenantId);
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';

    // Server-side authorization check: Only OWNER or Manager can manage staff and roles
    const auth = authorizeServerRequest(request, 'STAFF_ROLES_SCHEDULES', 'MANAGE', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (!body.name || !body.email || !body.role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
    }

    const cleanEmail = body.email.trim().toLowerCase();
    const cleanName = body.name.trim();

    let newUser: User;

    // 1. Direct database persistence when DATABASE_URL is available
    if (process.env.DATABASE_URL && !process.env.VITEST) {
      const existingInDb = await prisma.user.findFirst({
        where: { email: cleanEmail },
      });

      if (existingInDb) {
        return NextResponse.json(
          { error: 'A user with this email address already exists in the database' },
          { status: 400 }
        );
      }

      const created = await prisma.user.create({
        data: {
          id: `user-${Date.now()}`,
          tenantId,
          name: cleanName,
          email: cleanEmail,
          role: body.role,
          phone: body.phone?.trim() || null,
          password: body.password || 'password123',
        },
      });

      newUser = {
        id: created.id,
        tenantId: created.tenantId,
        name: created.name,
        email: created.email,
        role: created.role as any,
        phone: created.phone || undefined,
        isActive: true,
        status: 'ACTIVE' as const,
        createdAt: created.createdAt.toISOString(),
      };

      // Keep memory store in sync
      db.addUser(newUser);
    } else {
      // Check if email already exists in storage
      const existing = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return NextResponse.json({ error: 'A user with this email address already exists' }, { status: 400 });
      }

      newUser = db.createUser(tenantId, {
        name: cleanName,
        email: cleanEmail,
        role: body.role,
        phone: body.phone?.trim(),
      });
    }

    db.recordAuditEvent({
      tenantId,
      actorId: auth.user!.id,
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      action: 'USER_CREATE',
      entityType: 'USER',
      entityId: newUser.id,
      details: `Created staff user '${newUser.name}' with role '${newUser.role}' (${newUser.email})`,
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create staff user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';
    const { id, action, isActive, ...updates } = body;

    // Server authorization check: Only OWNER can modify staff roles and statuses
    const auth = authorizeServerRequest(request, 'STAFF_ROLES_SCHEDULES', 'FULL', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (action === 'TOGGLE_STATUS' && isActive !== undefined) {
      const updated = db.toggleUserStatus(tenantId, id, Boolean(isActive));
      if (!updated) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      db.recordAuditEvent({
        tenantId,
        actorId: auth.user!.id,
        actorName: auth.user!.name,
        actorRole: auth.user!.role,
        action: isActive ? 'USER_CREATE' : 'USER_DEACTIVATE',
        entityType: 'USER',
        entityId: id,
        details: `${isActive ? 'Activated' : 'Deactivated'} account for staff '${updated.name}'`,
      });

      return NextResponse.json({
        user: updated,
        message: `User account has been ${isActive ? 'activated' : 'deactivated'}`,
      });
    }

    // Check if role is changing
    if (updates.role) {
      const user = db.getUserById(id);
      if (user && user.role !== updates.role) {
        db.updateUserRole(id, updates.role, auth.user!.id);
      }
    }

    // Persist updates to Prisma DB if connected
    if (process.env.DATABASE_URL && !process.env.VITEST) {
      const updateData: Record<string, any> = {};
      if (updates.name) updateData.name = updates.name.trim();
      if (updates.email) updateData.email = updates.email.trim().toLowerCase();
      if (updates.role) updateData.role = updates.role;
      if (updates.phone !== undefined) updateData.phone = updates.phone ? updates.phone.trim() : null;

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id },
          data: updateData,
        }).catch((e) => console.warn('Prisma user update failed:', e));
      }
    }

    const updated = db.updateUser(tenantId, id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: updated, message: 'User updated successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update staff user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const tenantId = body.tenantId || searchParams.get('tenantId') || 'tenant-1';
    const id = body.id || searchParams.get('id');

    const auth = authorizeServerRequest(request, 'STAFF_ROLES_SCHEDULES', 'MANAGE', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Persist deletion to Prisma DB if connected
    if (process.env.DATABASE_URL && !process.env.VITEST) {
      await prisma.user.delete({
        where: { id },
      }).catch((e) => console.warn('Prisma user delete failed:', e));
    }

    const success = db.deleteUser(tenantId, id);
    if (!success) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    db.recordAuditEvent({
      tenantId,
      actorId: auth.user!.id,
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      action: 'USER_DEACTIVATE',
      entityType: 'USER',
      entityId: id,
      details: `Removed user account '${id}' from organization`,
    });

    return NextResponse.json({ success: true, message: 'Staff user removed successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete staff user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
