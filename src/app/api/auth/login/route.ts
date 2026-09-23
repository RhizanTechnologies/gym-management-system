import { NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let authResult = db.verifyCredentials(email, password);

    // Fallback: Check PostgreSQL directly if not found in memory
    if (!authResult && process.env.DATABASE_URL && !process.env.VITEST) {
      try {
        const { prisma } = await import('@/lib/prisma');
        const cleanEmail = email.trim().toLowerCase();
        const dbUser = await prisma.user.findFirst({
          where: { email: cleanEmail },
        });
        if (dbUser) {
          // Verify password against database
          if (password && dbUser.password !== password) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
          }
          const user = {
            id: dbUser.id,
            tenantId: dbUser.tenantId,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role as any,
            phone: dbUser.phone || undefined,
            avatarUrl: dbUser.avatarUrl || undefined,
            isActive: true,
            status: 'ACTIVE' as const,
            createdAt: dbUser.createdAt.toISOString(),
          };
          db.addUser(user);
          authResult = { user };
        }
      } catch (dbErr) {
        console.warn('Prisma login check failed:', dbErr);
      }
    }

    if (!authResult) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (authResult.error === 'ACCOUNT_DEACTIVATED') {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact your gym administrator.' },
        { status: 403 }
      );
    }

    const user = authResult.user!;
    const tenant = db.getTenantById(user.tenantId);

    // Create session payload
    const response = NextResponse.json({
      success: true,
      user,
      tenant,
      message: `Welcome back, ${user.name}!`,
    });

    // Set cookie for session
    response.cookies.set(
      'gymos_session',
      JSON.stringify({ userId: user.id, role: user.role, tenantId: user.tenantId }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }
    );

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
