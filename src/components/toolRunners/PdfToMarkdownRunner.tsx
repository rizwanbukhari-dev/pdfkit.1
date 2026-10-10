import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { loadPdfJsDocument, extractMarkdownFromPdf } from '../../utils/pdfjs';
import { readFileAsArrayBuffer } from '../../utils/formatters';
import { ProcessResult } from '../../types';
import { FileCode, AlertCircle, Sparkles } from 'lucide-react';

export const PdfToMarkdownRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setErrorMessage(null);
  };

  const handleExtract = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      const buffer = await readFileAsArrayBuffer(file);
      const pdfJsDoc = await loadPdfJsDocument(buffer);
      const markdown = await extractMarkdownFromPdf(pdfJsDoc);

      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        fileName: `${file.name.replace(/\.pdf$/i, '')}.md`,
        fileSize: blob.size,
        downloadUrl,
        blob,
        textContent: markdown,
      });

      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to convert PDF to Markdown.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'processing') {
    return <ProcessingState message="Generating Markdown..." step="Detecting headers, paragraphs, and structure" />;
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="PDF to Markdown" />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF to convert to Markdown"
          subtitle="Extract structured Markdown (.md) with page headings and syntax"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate max-w-xs sm:max-w-md">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ready to convert to Markdown</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              Change File
            </button>
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
              leftIcon={<FileCode className="w-5 h-5" />}
              onClick={handleExtract}
              className="w-full text-base py-4"
            >
              Convert to Markdown (.md)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
