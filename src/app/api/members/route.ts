import { NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { authorizeServerRequest } from '@/lib/rbac';
import { PaymentMethod } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'tenant-1';
  const query = searchParams.get('query') || undefined;
  const status = searchParams.get('status') || undefined;

  // Server-side authorization check: allow OWN_ONLY so members can access their pass
  const auth = authorizeServerRequest(request, 'MEMBER_PROFILE_MANAGE', 'OWN_ONLY', tenantId);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let rawMembers = db.getMembers(tenantId, query, status);

  // If role is MEMBER, enforce OWN_ONLY by restricting to their own profile
  if (auth.user?.role === 'MEMBER') {
    rawMembers = rawMembers.filter(
      (m) =>
        (auth.user?.email && m.email?.toLowerCase() === auth.user.email.toLowerCase()) ||
        m.id === auth.user?.id ||
        `user-${m.id}` === auth.user?.id
    );
  } else if (auth.user?.role === 'TRAINER') {
    // If role is TRAINER, restrict to members assigned to this trainer via PT assignments
    const trainerAssignments = db.getPTAssignments(tenantId, auth.user.id);
    const assignedMemberIds = new Set(trainerAssignments.map((a) => a.memberId));
    rawMembers = rawMembers.filter((m) => assignedMemberIds.has(m.id) || assignedMemberIds.has(m.memberNumber));
  }

  // Mask sensitive medical data based on caller role (Receptionist, Finance Officer, Maintenance)
  const members = rawMembers.map((m) => db.maskMemberMedicalData(m, auth.user?.role));

  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';

    // Server-side authorization check
    const auth = authorizeServerRequest(request, 'MEMBER_PROFILE_MANAGE', 'CREATE_UPDATE', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!body.firstName || !body.lastName || !body.phone) {
      return NextResponse.json(
        { error: 'First Name, Last Name and Phone are required' },
        { status: 400 }
      );
    }

    // Consent validation check
    if (body.consentGiven !== true) {
      return NextResponse.json(
        {
          error: 'CONSENT_REQUIRED',
          message: 'Member consent declaration is required for registration and activation.',
        },
        { status: 400 }
      );
    }

    // Duplicate detection check
    const duplicateCheck = db.checkDuplicateMember(tenantId, {
      phone: body.phone,
      email: body.email,
    });

    if (duplicateCheck.hasDuplicate && body.allowDuplicateOverride !== true) {
      return NextResponse.json(
        {
          error: 'DUPLICATE_PROFILE',
          conflictingField: duplicateCheck.duplicatePhone ? 'phone' : 'email',
          isDuplicate: true,
          duplicatePhone: !!duplicateCheck.duplicatePhone,
          duplicateEmail: !!duplicateCheck.duplicateEmail,
          message: duplicateCheck.message,
        },
        { status: 409 }
      );
    }

    const member = db.createMember(
      tenantId,
      {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth,
        address: body.address,
        joinDate: body.joinDate || new Date().toISOString(),
        emergencyContactName: body.emergencyContactName,
        emergencyContactRelationship: body.emergencyContactRelationship,
        emergencyContactPhone: body.emergencyContactPhone,
        medicalNotes: body.medicalNotes,
        consentGiven: true,
        consentDate: new Date().toISOString(),
        consentPolicyVersion: body.consentPolicyVersion || 'v1.0',
        profileImage: body.profileImage,
        photoIdReference: body.photoIdReference,
        notes: body.notes,
        planId: body.planId,
        subscriptionStart: body.subscriptionStart,
        subscriptionEnd: body.subscriptionEnd,
        dueBalance: Number(body.dueBalance) || 0,
        assignedLockerNumber: body.assignedLockerNumber,
      },
      {
        allowDuplicateOverride: body.allowDuplicateOverride === true,
        actor: auth.user
          ? { id: auth.user.id, name: auth.user.name, role: auth.user.role }
          : undefined,
        discount: Number(body.discount) || 0,
        discountReason: body.discountReason,
        paymentMethod: (body.paymentMethod as PaymentMethod) || 'CASH',
        paidAmount: body.paidAmount !== undefined ? Number(body.paidAmount) : undefined,
      }
    );

    const safeMember = auth.user ? db.maskMemberMedicalData(member, auth.user.role) : member;

    return NextResponse.json(
      {
        member: safeMember,
        invoice: member.invoice,
        receipt: member.receipt,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to register member';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
