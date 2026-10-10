import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { compressPdf } from '../../utils/pdfOps';
import { formatBytes } from '../../utils/formatters';
import { ProcessResult } from '../../types';
import { Minimize2, AlertCircle, FileText, Check, Zap, Gauge } from 'lucide-react';

export const CompressPdfRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<'extreme' | 'recommended' | 'low'>('recommended');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setErrorMessage(null);
  };

  const handleCompress = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      const { bytes, originalSize, compressedSize } = await compressPdf(file, preset);
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      // Honest reduction percentage calculation
      const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);

      setResult({
        fileName: `${file.name.replace(/\.pdf$/i, '')}_compressed.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
        originalSize,
        compressedSize,
        savingsPercent: reduction,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to compress PDF. Please verify the document is valid.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreset('recommended');
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'processing') {
    return (
      <ProcessingState
        message="Compressing PDF..."
        step="Rasterizing page layers and optimizing image compression streams"
      />
    );
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Compressed PDF" />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF to compress"
          subtitle="Reduce document size with real stream and image optimization"
        />
      ) : (
        <div className="space-y-6">
          {/* File Info */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate max-w-xs sm:max-w-md">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Original Size: {formatBytes(file.size)}
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              Change File
            </button>
          </div>

          {/* Compression Presets */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Select Compression Level
            </label>

            <div className="grid grid-cols-1 gap-3">
              {/* Recommended */}
              <div
                onClick={() => setPreset('recommended')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  preset === 'recommended'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        Recommended Compression
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        Balanced
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Good quality and significant size reduction. Best for most PDFs.
                    </p>
                  </div>
                </div>
                {preset === 'recommended' && <Check className="w-5 h-5 text-brand-600 shrink-0 ml-2" />}
              </div>

              {/* Extreme */}
              <div
                onClick={() => setPreset('extreme')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  preset === 'extreme'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                    <Minimize2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        Extreme Compression
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        Max Savings
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Smallest file size with standard image quality.
                    </p>
                  </div>
                </div>
                {preset === 'extreme' && <Check className="w-5 h-5 text-brand-600 shrink-0 ml-2" />}
              </div>

              {/* Low */}
              <div
                onClick={() => setPreset('low')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  preset === 'low'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        Low Compression (High Quality)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Maintains maximum sharpness and high-resolution details.
                    </p>
                  </div>
                </div>
                {preset === 'low' && <Check className="w-5 h-5 text-brand-600 shrink-0 ml-2" />}
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Minimize2 className="w-5 h-5" />}
              onClick={handleCompress}
              className="w-full text-base py-4"
            >
              Compress PDF Document
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
