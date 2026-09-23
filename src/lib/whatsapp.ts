import { Member, Tenant } from './types';

/**
 * Formats a phone number for WhatsApp wa.me links
 * Strips spaces, dashes, parentheses and ensures country code
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove non-digits except leading +
  let cleaned = phone.replace(/[^0-9+]/g, '');

  // If starts with +, remove + for wa.me
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('09') || cleaned.startsWith('07')) {
    // Common Ethiopia local format (09xxxxxxx -> 2519xxxxxxx)
    cleaned = '251' + cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Generates an instant WhatsApp renewal reminder URL
 */
export function getRenewalReminderUrl(member: Member, tenant: Tenant): string {
  const phone = formatPhoneForWhatsApp(member.phone);
  const expiryDate = member.subscriptionEnd
    ? new Date(member.subscriptionEnd).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'soon';

  const daysText =
    member.daysRemaining !== undefined && member.daysRemaining <= 0
      ? 'has expired'
      : `is expiring in ${member.daysRemaining || 1} day(s) on ${expiryDate}`;

  const message = `Hello ${member.firstName}! 👋
This is ${tenant.name}.

Just a friendly reminder that your gym membership (${member.currentPlanName || 'Plan'}) ${daysText}.

To avoid interruption to your workouts, please renew your membership at the front desk or contact us directly.

📍 ${tenant.address}
📞 ${tenant.phone}
See you at the gym! 💪🏋️‍♂️`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates a WhatsApp payment / due balance reminder URL
 */
export function getDebtReminderUrl(member: Member, tenant: Tenant): string {
  const phone = formatPhoneForWhatsApp(member.phone);
  const currency = tenant.currencySymbol || 'ETB';

  const message = `Hello ${member.firstName}! 👋
This is ${tenant.name} accounting.

We would like to remind you of a pending balance of ${currency} ${member.dueBalance.toFixed(2)} on your gym account.

Please visit the front desk to settle your balance at your earliest convenience.

📞 Inquiries: ${tenant.phone}
Thank you for your cooperation!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates a WhatsApp welcome message with their digital QR pass link
 */
export function getWelcomePassUrl(member: Member, tenant: Tenant, origin: string = ''): string {
  const phone = formatPhoneForWhatsApp(member.phone);
  const passUrl = `${origin}/member-portal`;

  const message = `Welcome to ${tenant.name}, ${member.firstName}! 🎉🏋️‍♂️

Your membership is officially active!
Member ID: ${member.memberNumber}
Plan: ${member.currentPlanName || 'Active Plan'}

📲 Access your Digital QR Pass here:
${passUrl}

💡 Tip: Tap your browser's "Add to Home Screen" to save your pass like an app on your phone for instant check-in!

Need help? Call us at ${tenant.phone}. Have an amazing workout! 💪`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates a re-engagement WhatsApp message for inactive members
 */
export function getAbsenceReminderUrl(member: Member, tenant: Tenant): string {
  const phone = formatPhoneForWhatsApp(member.phone);

  const message = `Hey ${member.firstName}! 💪
We missed you at ${tenant.name}!

Consistency is where the results happen. Your workout streak is waiting for you! Come in this week and crush your goals.

📍 ${tenant.address}
See you on the gym floor! 🏋️`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
