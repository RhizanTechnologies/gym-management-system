import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  // Try Prisma DB first
  if (process.env.DATABASE_URL && !process.env.VITEST) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (dbUser) {
        return NextResponse.json({
          success: true,
          user: {
            id: dbUser.id,
            tenantId: dbUser.tenantId,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            phone: dbUser.phone || '',
            avatarUrl: dbUser.avatarUrl || '',
            createdAt: dbUser.createdAt.toISOString(),
          },
        });
      }
    } catch (e) {
      console.warn('Prisma profile query failed:', e);
    }
  }

  // Fallback to in-memory
  const user = db.getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      avatarUrl: user.avatarUrl || '',
      createdAt: user.createdAt,
    },
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, email, phone, currentPassword, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, any> = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (email && email.trim()) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;

    // Password change flow
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change your password' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters' },
          { status: 400 }
        );
      }

      // Verify current password against DB
      if (process.env.DATABASE_URL && !process.env.VITEST) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
          });

          if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
          }

          if (dbUser.password !== currentPassword) {
            return NextResponse.json(
              { error: 'Current password is incorrect' },
              { status: 403 }
            );
          }

          updateData.password = newPassword;
        } catch (e) {
          console.warn('Prisma password verification failed:', e);
          return NextResponse.json({ error: 'Failed to verify current password' }, { status: 500 });
        }
      } else {
        // In test/memory mode, just allow the change
        updateData.password = newPassword;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Check email uniqueness if email is changing
    if (updateData.email) {
      if (process.env.DATABASE_URL && !process.env.VITEST) {
        const existingEmail = await prisma.user.findFirst({
          where: {
            email: updateData.email,
            NOT: { id: userId },
          },
        });

        if (existingEmail) {
          return NextResponse.json(
            { error: 'This email address is already used by another account' },
            { status: 400 }
          );
        }
      }
    }

    // Persist to PostgreSQL
    let updatedUser;
    if (process.env.DATABASE_URL && !process.env.VITEST) {
      try {
        const result = await prisma.user.update({
          where: { id: userId },
          data: updateData,
        });

        updatedUser = {
          id: result.id,
          tenantId: result.tenantId,
          name: result.name,
          email: result.email,
          role: result.role,
          phone: result.phone || '',
          avatarUrl: result.avatarUrl || '',
          createdAt: result.createdAt.toISOString(),
        };
      } catch (e: any) {
        console.error('Prisma profile update failed:', e);
        return NextResponse.json(
          { error: e.message || 'Failed to update profile in database' },
          { status: 500 }
        );
      }
    }

    // Also update in-memory store
    const memUser = db.getUserById(userId);
    if (memUser) {
      if (updateData.name) memUser.name = updateData.name;
      if (updateData.email) memUser.email = updateData.email;
      if (updateData.phone !== undefined) memUser.phone = updateData.phone || undefined;
    }

    return NextResponse.json({
      success: true,
      user: updatedUser || {
        id: memUser?.id || userId,
        tenantId: memUser?.tenantId || 'tenant-1',
        name: memUser?.name || name,
        email: memUser?.email || email,
        role: memUser?.role || 'RECEPTIONIST',
        phone: memUser?.phone || '',
        createdAt: memUser?.createdAt || new Date().toISOString(),
      },
      message: newPassword ? 'Profile and password updated successfully' : 'Profile updated successfully',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
