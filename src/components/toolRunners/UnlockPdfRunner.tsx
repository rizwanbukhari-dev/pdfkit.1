import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { unlockPdf } from '../../utils/documentExporters';
import { ProcessResult } from '../../types';
import { Unlock, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

export const UnlockPdfRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [outputFileName, setOutputFileName] = useState('unlocked_document');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setOutputFileName(`${f.name.replace(/\.pdf$/i, '')}_unlocked`);
    setErrorMessage(null);
  };

  const handleUnlock = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      const outBytes = await unlockPdf(file, password);
      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const cleanName = outputFileName.trim() || 'unlocked_document';
      setResult({
        fileName: `${cleanName.replace(/\.pdf$/i, '')}.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to remove password protection. Check if the password is correct.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPassword('');
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'processing') {
    return (
      <ProcessingState
        message="Removing security restrictions..."
        step="Decrypting document streams and unlocking full user permissions"
      />
    );
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Unlocked PDF" />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a locked or restricted PDF"
          subtitle="Remove password protection and permissions restrictions to make document freely editable and printable"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Unlock className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Ready to unlock</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors shrink-0"
            >
              Change File
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
              Document Password (Optional if only permissions-restricted)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password if required..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
            />
            <p className="text-[11px] text-slate-400">
              If the document is owner-restricted (print-locked or copy-locked), unlocking works instantly without a password.
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
              leftIcon={<Unlock className="w-5 h-5" />}
              onClick={handleUnlock}
              className="w-full text-base py-4 font-bold shadow-lg shadow-brand-500/25"
            >
              Unlock & Remove Restrictions
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
