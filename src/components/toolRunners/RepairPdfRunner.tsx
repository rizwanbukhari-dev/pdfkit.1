import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { repairPdf } from '../../utils/pdfOps';
import { ProcessResult } from '../../types';
import { Wrench, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export const RepairPdfRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setErrorMessage(null);
  };

  const handleRepair = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      const repairedBytes = await repairPdf(file);
      const blob = new Blob([repairedBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        fileName: `${file.name.replace(/\.pdf$/i, '')}_repaired.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Unable to repair this file. The document data may be irreversibly damaged.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'processing') {
    return (
      <ProcessingState
        message="Analyzing and repairing PDF..."
        step="Rebuilding cross-reference tables, dictionary trees, and streams"
      />
    );
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Repaired PDF" />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a corrupted or damaged PDF"
          subtitle="We analyze and rebuild internal PDF stream structures to restore accessibility"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate max-w-xs sm:max-w-md">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ready to repair</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              Change File
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Diagnostic Assessment Ready</span>
            </h4>
            <p>
              PDFKit will parse and reconstruct corrupted cross-reference tables (XREFs), repair broken dictionary headers, and clean unused trailer objects.
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Wrench className="w-5 h-5" />}
              onClick={handleRepair}
              className="w-full text-base py-4"
            >
              Repair & Restore PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
