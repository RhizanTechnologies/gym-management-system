import type { PaperImportRow } from './types.ts';

/**
 * Parses CSV text or raw table pasted from Excel/Paper log sheets
 */
export function parsePaperCSV(csvText: string): { rows: PaperImportRow[]; rawCount: number; errors: string[] } {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], rawCount: 0, errors: ['No data found in uploaded text or file.'] };
  }

  const errors: string[] = [];
  const rows: PaperImportRow[] = [];

  // Determine delimiter (comma or tab)
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : ',';

  // Check if first line is a header
  const lowerFirst = firstLine.toLowerCase();
  const hasHeader =
    lowerFirst.includes('name') ||
    lowerFirst.includes('phone') ||
    lowerFirst.includes('member') ||
    lowerFirst.includes('plan');

  let nameIdx = 0;
  let phoneIdx = 1;
  let emailIdx = 2;
  let planIdx = 3;
  let startIdx = 4;
  let endIdx = 5;
  let paidIdx = 6;
  let balanceIdx = 7;
  let lockerIdx = 8;

  if (hasHeader) {
    const headers = firstLine.split(delimiter).map((h) => h.trim().toLowerCase().replace(/["']/g, ''));
    headers.forEach((h, idx) => {
      if (h.includes('name')) nameIdx = idx;
      else if (h.includes('phone') || h.includes('mobile') || h.includes('tel')) phoneIdx = idx;
      else if (h.includes('email') || h.includes('mail')) emailIdx = idx;
      else if (h.includes('plan') || h.includes('package') || h.includes('tier')) planIdx = idx;
      else if (h.includes('start') || h.includes('joined') || h.includes('from')) startIdx = idx;
      else if (h.includes('end') || h.includes('expir') || h.includes('to')) endIdx = idx;
      else if (h.includes('paid') || h.includes('price') || h.includes('amount')) paidIdx = idx;
      else if (h.includes('balance') || h.includes('due') || h.includes('debt')) balanceIdx = idx;
      else if (h.includes('locker')) lockerIdx = idx;
    });
  }

  const dataLines = hasHeader ? lines.slice(1) : lines;

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    // Simple CSV parser supporting quotes
    const cells: string[] = [];
    let inQuotes = false;
    let currentCell = '';

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());

    if (cells.length < 2) {
      errors.push(`Line ${i + (hasHeader ? 2 : 1)}: Insufficient columns.`);
      continue;
    }

    const clean = (val?: string) => val?.replace(/^["']|["']$/g, '').trim();

    const fullName = clean(cells[nameIdx]);
    const phone = clean(cells[phoneIdx]);
    const email = clean(cells[emailIdx]);
    const planName = clean(cells[planIdx]) || 'Monthly Standard';
    const startDate = clean(cells[startIdx]) || new Date().toISOString().split('T')[0];
    const endDate = clean(cells[endIdx]) || '';
    const amountPaid = parseFloat(clean(cells[paidIdx]) || '0') || 0;
    const balanceDue = parseFloat(clean(cells[balanceIdx]) || '0') || 0;
    const lockerNumber = clean(cells[lockerIdx]) || undefined;

    if (!fullName || !phone) {
      errors.push(`Line ${i + (hasHeader ? 2 : 1)}: Name or Phone is blank.`);
      continue;
    }

    rows.push({
      fullName,
      phone,
      email: email && email.includes('@') ? email : undefined,
      planName: planName || 'Monthly Standard',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate,
      amountPaid,
      balanceDue,
      lockerNumber,
    });
  }

  return {
    rows,
    rawCount: dataLines.length,
    errors,
  };
}

export const SAMPLE_PAPER_CSV_TEMPLATE = `Full Name,Phone,Email,Plan,Start Date,End Date,Amount Paid,Balance Due,Locker
Abel Kebede,+251911445566,abel@example.com,Monthly Standard,2026-08-01,2026-08-31,45,0,L-01
Meron Hailu,+251922556677,meron@example.com,3-Month Pro Power,2026-07-15,2026-10-15,120,0,L-02
Kassahun Desta,+251933667788,,Monthly Standard,2026-07-20,2026-08-20,45,0,
Tigist Assefa,+251944778899,tigist@example.com,Annual VIP All-Access,2026-08-10,2027-08-10,420,0,VIP-03
Solomon Worku,+251955889900,,Monthly Standard,2026-07-10,2026-08-10,25,20,`;
