import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { loadPdfJsDocument, extractAllTextFromPdf } from '../../utils/pdfjs';
import { readFileAsArrayBuffer } from '../../utils/formatters';
import { ProcessResult } from '../../types';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { GitCompare, FileText, Check, AlertCircle, Plus } from 'lucide-react';

export const ComparePdfRunner: React.FC = () => {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [diffReport, setDiffReport] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleCompare = async () => {
    if (!fileA || !fileB) {
      setErrorMessage('Please select both Document A and Document B to compare.');
      return;
    }

    try {
      setStatus('processing');
      setErrorMessage(null);

      const bufA = await readFileAsArrayBuffer(fileA);
      const bufB = await readFileAsArrayBuffer(fileB);

      const pdfA = await loadPdfJsDocument(bufA);
      const pdfB = await loadPdfJsDocument(bufB);

      const textA = await extractAllTextFromPdf(pdfA);
      const textB = await extractAllTextFromPdf(pdfB);

      const linesA = textA.split('\n').map((l) => l.trim()).filter(Boolean);
      const linesB = textB.split('\n').map((l) => l.trim()).filter(Boolean);

      const setB = new Set(linesB);
      const setA = new Set(linesA);

      const added = linesB.filter((l) => !setA.has(l));
      const removed = linesA.filter((l) => !setB.has(l));

      const reportText = [
        `=== COMPARISON REPORT ===`,
        `Document A: ${fileA.name} (${pdfA.numPages} pages)`,
        `Document B: ${fileB.name} (${pdfB.numPages} pages)`,
        `\n[SUMMARY OF DIFFERENCES]`,
        `Lines only in Document B (Added/Modified): ${added.length}`,
        `Lines only in Document A (Removed/Replaced): ${removed.length}`,
        `\n[ADDITIONS IN DOCUMENT B]`,
        ...added.slice(0, 20).map((l) => `+ ${l}`),
        `\n[REMOVALS FROM DOCUMENT A]`,
        ...removed.slice(0, 20).map((l) => `- ${l}`),
      ].join('\n');

      setDiffReport(reportText);

      // Create downloadable PDF Report
      const pdfDoc = await PDFDocument.create();
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      let page = pdfDoc.addPage([595.28, 841.89]);
      let y = 841.89 - 50;

      page.drawText('Document Comparison Difference Report', {
        x: 50,
        y,
        size: 16,
        font: fontBold,
        color: rgb(0.1, 0.15, 0.3),
      });
      y -= 25;

      page.drawText(`Comparing: ${fileA.name} vs ${fileB.name}`, {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 30;

      const reportLines = reportText.split('\n');
      for (const line of reportLines) {
        if (y < 50) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = 841.89 - 50;
        }

        const isAdd = line.startsWith('+');
        const isRem = line.startsWith('-');
        const color = isAdd ? rgb(0.1, 0.6, 0.2) : isRem ? rgb(0.8, 0.1, 0.1) : rgb(0.2, 0.2, 0.2);

        page.drawText(line.slice(0, 85), {
          x: 50,
          y,
          size: 9.5,
          font: isAdd || isRem ? fontBold : font,
          color,
        });
        y -= 14;
      }

      const outBytes = await pdfDoc.save();
      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        fileName: `comparison_report_${fileA.name.replace(/\.pdf$/i, '')}_vs_${fileB.name.replace(/\.pdf$/i, '')}.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
        textContent: reportText,
      });

      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to compare PDF documents.');
    }
  };

  const handleReset = () => {
    setFileA(null);
    setFileB(null);
    setDiffReport(null);
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'processing') {
    return (
      <ProcessingState
        message="Comparing documents..."
        step="Extracting text glyphs and performing textual difference analysis"
      />
    );
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Comparison Report" />;
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Document A Upload */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center font-bold">
              A
            </span>
            <span>First Document (Original)</span>
          </div>

          {!fileA ? (
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 transition-colors">
              <FileText className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Document A
              </span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setFileA(e.target.files[0])}
              />
            </label>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <span className="text-xs font-semibold truncate max-w-[200px]">{fileA.name}</span>
              <button
                onClick={() => setFileA(null)}
                className="text-xs text-red-500 hover:underline"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Document B Upload */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
            <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-bold">
              B
            </span>
            <span>Second Document (Modified)</span>
          </div>

          {!fileB ? (
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 transition-colors">
              <FileText className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Document B
              </span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setFileB(e.target.files[0])}
              />
            </label>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <span className="text-xs font-semibold truncate max-w-[200px]">{fileB.name}</span>
              <button
                onClick={() => setFileB(null)}
                className="text-xs text-red-500 hover:underline"
              >
                Change
              </button>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        leftIcon={<GitCompare className="w-5 h-5" />}
        onClick={handleCompare}
        disabled={!fileA || !fileB}
        className="w-full text-base py-4 font-bold shadow-lg shadow-brand-500/25 disabled:opacity-50"
      >
        Compare Documents & Generate Diff Report
      </Button>
    </div>
  );
};
