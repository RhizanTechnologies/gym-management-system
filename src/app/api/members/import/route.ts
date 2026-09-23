import { NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { parsePaperCSV } from '@/lib/paper-importer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';

    if (body.csvText) {
      const parsed = parsePaperCSV(body.csvText);
      if (parsed.rows.length === 0) {
        return NextResponse.json({ error: 'No valid rows parsed from input', details: parsed.errors }, { status: 400 });
      }

      const result = db.bulkImportPaperMembers(tenantId, parsed.rows);
      return NextResponse.json({
        success: true,
        imported: result.imported,
        errors: [...parsed.errors, ...result.errors],
      });
    }

    if (Array.isArray(body.rows)) {
      const result = db.bulkImportPaperMembers(tenantId, body.rows);
      return NextResponse.json({
        success: true,
        imported: result.imported,
        errors: result.errors,
      });
    }

    return NextResponse.json({ error: 'csvText or rows array is required' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
