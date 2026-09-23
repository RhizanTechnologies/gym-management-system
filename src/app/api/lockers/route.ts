import { NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { Locker } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'tenant-1';

  // Live database query when DATABASE_URL is available
  if (process.env.DATABASE_URL && !process.env.VITEST) {
    try {
      const dbLockers = await prisma.locker.findMany({
        where: { tenantId },
        orderBy: { number: 'asc' },
      });

      if (dbLockers && dbLockers.length > 0) {
        const lockers: Locker[] = dbLockers.map((l) => ({
          id: l.id,
          tenantId: l.tenantId,
          number: l.number,
          zone: (l.zone as any) || 'Main',
          status: l.status as any,
          memberId: l.memberId || undefined,
          memberName: l.memberName || undefined,
          memberPhone: l.memberPhone || undefined,
          assignedAt: l.assignedAt?.toISOString(),
          expiresAt: l.expiresAt?.toISOString(),
        }));

        // Keep in-memory store in sync
        for (const locker of lockers) {
          const idx = db.getLockers(tenantId).findIndex((existing) => existing.id === locker.id || existing.number === locker.number);
          if (idx === -1) {
            db.getLockers(tenantId).push(locker);
          }
        }

        return NextResponse.json({ lockers });
      }
    } catch (err) {
      console.warn('Prisma lockers fetch failed, falling back to memory store:', err);
    }
  }

  const lockers = db.getLockers(tenantId);
  return NextResponse.json({ lockers });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';

    if (body.action === 'CREATE_LOCKER') {
      if (!body.number) {
        return NextResponse.json({ error: 'Locker number is required' }, { status: 400 });
      }

      let locker: Locker;

      if (process.env.DATABASE_URL && !process.env.VITEST) {
        const existing = await prisma.locker.findFirst({
          where: { tenantId, number: body.number.trim() },
        });
        if (existing) {
          return NextResponse.json({ error: 'A locker with this number already exists' }, { status: 400 });
        }

        const created = await prisma.locker.create({
          data: {
            id: `lock-${Date.now()}`,
            tenantId,
            number: body.number.trim(),
            zone: body.zone || 'Main Zone',
            status: 'AVAILABLE',
          },
        });

        locker = {
          id: created.id,
          tenantId: created.tenantId,
          number: created.number,
          zone: created.zone,
          status: 'AVAILABLE',
        };
        db.createLocker(tenantId, { number: locker.number, zone: locker.zone });
      } else {
        locker = db.createLocker(tenantId, {
          number: body.number,
          zone: body.zone || 'Main Zone',
        });
      }

      return NextResponse.json({ locker }, { status: 201 });
    }

    if (body.action === 'UPDATE_LOCKER') {
      if (process.env.DATABASE_URL && !process.env.VITEST) {
        await prisma.locker.update({
          where: { id: body.id },
          data: {
            ...(body.updates?.number ? { number: body.updates.number } : {}),
            ...(body.updates?.zone ? { zone: body.updates.zone } : {}),
            ...(body.updates?.status ? { status: body.updates.status } : {}),
          },
        }).catch((e) => console.warn('Prisma update locker failed:', e));
      }

      const locker = db.updateLocker(tenantId, body.id, body.updates);
      if (!locker) {
        return NextResponse.json({ error: 'Locker not found' }, { status: 404 });
      }
      return NextResponse.json({ locker });
    }

    if (body.action === 'DELETE_LOCKER') {
      if (process.env.DATABASE_URL && !process.env.VITEST) {
        await prisma.locker.delete({
          where: { id: body.id },
        }).catch((e) => console.warn('Prisma delete locker failed:', e));
      }

      const success = db.deleteLocker(tenantId, body.id);
      if (!success) {
        return NextResponse.json({ error: 'Locker not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Locker deleted' });
    }

    if (body.action === 'ASSIGN') {
      if (!body.lockerNumber || !body.memberId) {
        return NextResponse.json({ error: 'Locker number and Member ID are required' }, { status: 400 });
      }

      if (process.env.DATABASE_URL && !process.env.VITEST) {
        try {
          await prisma.locker.updateMany({
            where: { tenantId, number: body.lockerNumber },
            data: {
              status: 'OCCUPIED',
              memberId: body.memberId,
              memberName: body.memberName || 'Member',
              memberPhone: body.memberPhone || null,
              assignedAt: new Date(),
              expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
            },
          });

          await prisma.member.updateMany({
            where: { tenantId, id: body.memberId },
            data: {
              assignedLockerNumber: body.lockerNumber,
            },
          });
        } catch (e) {
          console.warn('Prisma locker assign failed:', e);
        }
      }

      const locker = db.assignLocker(
        tenantId,
        body.lockerNumber,
        body.memberId,
        body.memberName || 'Member',
        body.memberPhone || '',
        body.expiresAt
      );

      return NextResponse.json({ locker });
    }

    if (body.action === 'RELEASE') {
      if (!body.lockerNumber) {
        return NextResponse.json({ error: 'Locker number is required' }, { status: 400 });
      }

      if (process.env.DATABASE_URL && !process.env.VITEST) {
        try {
          await prisma.locker.updateMany({
            where: { tenantId, number: body.lockerNumber },
            data: {
              status: 'AVAILABLE',
              memberId: null,
              memberName: null,
              memberPhone: null,
              assignedAt: null,
              expiresAt: null,
            },
          });

          await prisma.member.updateMany({
            where: { tenantId, assignedLockerNumber: body.lockerNumber },
            data: {
              assignedLockerNumber: null,
            },
          });
        } catch (e) {
          console.warn('Prisma locker release failed:', e);
        }
      }

      const success = db.releaseLocker(tenantId, body.lockerNumber);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Invalid locker action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Locker action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
