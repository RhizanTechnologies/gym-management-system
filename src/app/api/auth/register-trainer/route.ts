import { NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, tenantId = 'tenant-1' } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Trainer name and email are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    let newTrainer;

    if (process.env.DATABASE_URL && !process.env.VITEST) {
      const { prisma } = await import('@/lib/prisma');
      const existingDb = await prisma.user.findFirst({
        where: { email: cleanEmail },
      });
      if (existingDb) {
        return NextResponse.json(
          { error: 'An account with this email address already exists. Please log in directly.' },
          { status: 400 }
        );
      }

      const created = await prisma.user.create({
        data: {
          id: `user-${Date.now()}`,
          tenantId,
          name: cleanName,
          email: cleanEmail,
          phone: phone ? phone.trim() : null,
          role: 'TRAINER',
          password: 'password123',
        },
      });

      newTrainer = {
        id: created.id,
        tenantId: created.tenantId,
        name: created.name,
        email: created.email,
        phone: created.phone || undefined,
        role: 'TRAINER' as const,
        isActive: true,
        status: 'ACTIVE' as const,
        createdAt: created.createdAt.toISOString(),
      };

      db.addUser(newTrainer);
    } else {
      const existing = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return NextResponse.json(
          { error: 'An account with this email address already exists. Please log in directly.' },
          { status: 400 }
        );
      }

      newTrainer = db.createUser(tenantId, {
        name: cleanName,
        email: cleanEmail,
        phone: phone ? phone.trim() : undefined,
        role: 'TRAINER',
      });
    }

    db.recordAuditEvent({
      tenantId,
      actorId: newTrainer.id,
      actorName: newTrainer.name,
      actorRole: 'TRAINER',
      action: 'USER_CREATE',
      entityType: 'USER',
      entityId: newTrainer.id,
      details: `New Personal Trainer '${newTrainer.name}' joined the team (${newTrainer.email})`,
    });

    return NextResponse.json({
      success: true,
      user: newTrainer,
      message: 'Trainer profile successfully registered! You can now log in to manage your trainees.',
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to register trainer';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
