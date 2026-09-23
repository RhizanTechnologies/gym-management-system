'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { parsePaperCSV, SAMPLE_PAPER_CSV_TEMPLATE } from '@/lib/paper-importer';
import { PaperImportRow } from '@/lib/types';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ClipboardPaste,
  Trash2,
} from 'lucide-react';

export default function PaperImportPage() {
  const { currentTenant } = useAuth();
  const [csvText, setCsvText] = useState(SAMPLE_PAPER_CSV_TEMPLATE);
  const [parsedData, setParsedData] = useState<{ rows: PaperImportRow[]; rawCount: number; errors: string[] }>({
    rows: [],
    rawCount: 0,
    errors: [],
  });
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; errors: string[] } | null>(null);

  const handleParse = (text: string) => {
    setCsvText(text);
    const res = parsePaperCSV(text);
    setParsedData(res);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleParse(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const element = document.createElement('a');
    const file = new Blob([SAMPLE_PAPER_CSV_TEMPLATE], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    element.download = 'gymos-paper-migration-template.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRunImport = async () => {
    if (parsedData.rows.length === 0) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/members/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          rows: parsedData.rows,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportResult({
          success: true,
          imported: data.imported,
          errors: data.errors || [],
        });
      } else {
        setImportResult({
          success: false,
          imported: 0,
          errors: [data.error || 'Import failed'],
        });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Import failed';
      setImportResult({
        success: false,
        imported: 0,
        errors: [message],
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Paper-to-Digital Migration Tool
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Convert handwritten gym notebooks and Excel sheets into instant digital member passes in 60 seconds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Migration Steps & Upload Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Instructions & Paste Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <ClipboardPaste className="h-4 w-4 text-emerald-600" /> Step 1: Upload or Paste Data
            </h2>

            {/* File Upload Drop Area */}
            <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-emerald-500 cursor-pointer transition-all">
              <Upload className="h-8 w-8 text-emerald-600 mb-2" />
              <p className="text-xs font-bold text-slate-900">Click to upload CSV / Excel file</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Supports .csv or exported sheets</p>
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* Raw Text Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Or Paste Paper Log Text</label>
                <button
                  onClick={() => handleParse('')}
                  className="text-[11px] text-slate-500 hover:text-red-600 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              </div>
              <textarea
                rows={10}
                value={csvText}
                onChange={(e) => handleParse(e.target.value)}
                placeholder="Paste CSV rows here..."
                className="w-full font-mono text-xs rounded-2xl border border-slate-300 bg-white p-4 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <button
              onClick={() => handleParse(csvText)}
              className="w-full rounded-xl bg-slate-100 border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all"
            >
              Re-parse & Validate Data
            </button>
          </div>
        </div>

        {/* Right: Preview & Execution */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" /> Step 2: Live Import Preview
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Parsed: <strong className="text-slate-900">{parsedData.rows.length} valid members</strong>
                </p>
              </div>

              {parsedData.rows.length > 0 && (
                <button
                  onClick={handleRunImport}
                  disabled={isImporting}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-500 transition-all disabled:opacity-50"
                >
                  {isImporting ? (
                    <span>Importing to {currentTenant.name}...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Import {parsedData.rows.length} Members Now</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Success Result Box */}
            {importResult && (
              <div
                className={`rounded-2xl p-4 border ${
                  importResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {importResult.success ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    <span>
                      {importResult.success
                        ? `🎉 Successfully migrated ${importResult.imported} paper records to digital!`
                        : 'Import encountered issues'}
                    </span>
                  </div>
                  {importResult.success && (
                    <Link
                      href="/members"
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-500"
                    >
                      <span>View Directory</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">Name</th>
                      <th className="px-3 py-2.5">Phone</th>
                      <th className="px-3 py-2.5">Plan</th>
                      <th className="px-3 py-2.5">Paid</th>
                      <th className="px-3 py-2.5">Balance</th>
                      <th className="px-3 py-2.5">Locker</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.rows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-500">
                          Paste or upload member logs above to see live preview.
                        </td>
                      </tr>
                    ) : (
                      parsedData.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-500 font-mono">{idx + 1}</td>
                          <td className="px-3 py-2 font-bold text-slate-900 truncate max-w-[130px]">{row.fullName}</td>
                          <td className="px-3 py-2 text-slate-600 font-mono">{row.phone}</td>
                          <td className="px-3 py-2 text-slate-600">{row.planName}</td>
                          <td className="px-3 py-2 font-semibold text-emerald-700">${row.amountPaid}</td>
                          <td className="px-3 py-2">
                            {row.balanceDue > 0 ? (
                              <span className="font-bold text-red-600">${row.balanceDue}</span>
                            ) : (
                              <span className="text-slate-400">$0</span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-700 font-bold">{row.lockerNumber || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
