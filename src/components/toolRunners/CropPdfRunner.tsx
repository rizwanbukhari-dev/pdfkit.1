import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { cropPdf } from '../../utils/pdfOps';
import { ProcessResult } from '../../types';
import { Crop, AlertCircle, FileText } from 'lucide-react';

export const CropPdfRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [margins, setMargins] = useState({ top: 30, bottom: 30, left: 30, right: 30 });
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setErrorMessage(null);
  };

  const handleCrop = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      const croppedBytes = await cropPdf(file, margins);
      const blob = new Blob([croppedBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        fileName: `${file.name.replace(/\.pdf$/i, '')}_cropped.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to crop PDF document.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'processing') {
    return <ProcessingState message="Cropping PDF..." step="Calculating new page boundaries and cropboxes" />;
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Cropped PDF" />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF to crop"
          subtitle="Trim page margins and adjust visible canvas boundaries"
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
                <p className="text-xs text-slate-500 dark:text-slate-400">Crop boundary configuration</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              Change File
            </button>
          </div>

          {/* Margins Input Grid */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Margin Trims (in points, 1 in = 72 pt)
            </label>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Top Trim</span>
                <input
                  type="number"
                  min={0}
                  value={margins.top}
                  onChange={(e) => setMargins({ ...margins, top: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Bottom Trim</span>
                <input
                  type="number"
                  min={0}
                  value={margins.bottom}
                  onChange={(e) => setMargins({ ...margins, bottom: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Left Trim</span>
                <input
                  type="number"
                  min={0}
                  value={margins.left}
                  onChange={(e) => setMargins({ ...margins, left: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Right Trim</span>
                <input
                  type="number"
                  min={0}
                  value={margins.right}
                  onChange={(e) => setMargins({ ...margins, right: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>
            </div>
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
              leftIcon={<Crop className="w-5 h-5" />}
              onClick={handleCrop}
              className="w-full text-base py-4"
            >
              Crop PDF Margins
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
