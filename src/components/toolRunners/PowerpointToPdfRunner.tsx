import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { convertPptxToPdf } from '../../utils/officeConverters';
import { formatBytes } from '../../utils/formatters';
import { ProcessResult } from '../../types';
import { Presentation, AlertCircle } from 'lucide-react';

export const PowerpointToPdfRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [outputFileName, setOutputFileName] = useState('presentation_slides');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setOutputFileName(f.name.replace(/\.[^/.]+$/, ''));
    setErrorMessage(null);
  };

  const handleConvert = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      const outBytes = await convertPptxToPdf(file);
      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const cleanName = outputFileName.trim() || 'presentation_slides';
      setResult({
        fileName: `${cleanName.replace(/\.pdf$/i, '')}.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to convert PowerPoint presentation to PDF.');
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
        message="Converting PowerPoint slides to PDF..."
        step="Extracting presentation slides, layout shapes, and rendering high-resolution vector pages"
      />
    );
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="PowerPoint to PDF" />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PowerPoint presentation (.pptx)"
          subtitle="Convert PowerPoint presentations into clean 16:9 widescreen PDF slides"
        />
      ) : (
        <div className="space-y-6">
          {/* File Card */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shrink-0">
                <Presentation className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {formatBytes(file.size)}
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors shrink-0"
            >
              Change File
            </button>
          </div>

          {/* Configuration Options */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4 text-xs">
            {/* Output File Name */}
            <div className="space-y-1.5 text-left">
              <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                Output File Name
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus-within:ring-2 focus-within:ring-brand-500 overflow-hidden">
                <input
                  type="text"
                  value={outputFileName}
                  onChange={(e) => setOutputFileName(e.target.value)}
                  placeholder="e.g. business_pitch"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-transparent outline-none font-semibold"
                />
                <span className="pr-3 pl-2.5 py-2.5 font-mono text-slate-500 dark:text-slate-400 font-bold select-none bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
                  .pdf
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-left">
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                Standard 16:9 Widescreen slides layout
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Each presentation slide is rendered as a clean, high-resolution vector PDF page ready for printing and screen presentations.
              </p>
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
              leftIcon={<Presentation className="w-5 h-5" />}
              onClick={handleConvert}
              className="w-full text-base py-4"
            >
              Convert PowerPoint to PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
