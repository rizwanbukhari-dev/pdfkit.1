import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { removePages } from '../../utils/pdfOps';
import { loadPdfJsDocument, getPageThumbnail } from '../../utils/pdfjs';
import { readFileAsArrayBuffer } from '../../utils/formatters';
import { ProcessResult } from '../../types';
import { Trash2, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export const RemovePagesRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedForRemoval, setSelectedForRemoval] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<'idle' | 'loadingDoc' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setStatus('loadingDoc');
    setErrorMessage(null);

    try {
      const buffer = await readFileAsArrayBuffer(selected);
      let total = 0;
      try {
        const pdfLibDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        total = pdfLibDoc.getPageCount();
        setPageCount(total);
      } catch {
        // fallback
      }

      try {
        const pdfJsDoc = await loadPdfJsDocument(buffer);
        if (!total) {
          total = pdfJsDoc.numPages;
          setPageCount(total);
        }

        const thumbs: string[] = [];
        const loadCount = Math.min(total, 60);
        for (let i = 1; i <= loadCount; i++) {
          try {
            const thumb = await getPageThumbnail(pdfJsDoc, i, 180);
            thumbs.push(thumb);
          } catch {
            // continue
          }
        }
        setThumbnails(thumbs);
      } catch {
        // thumbnails optional
      }

      setSelectedForRemoval(new Set());
      setStatus('idle');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Could not load PDF document.');
    }
  };

  const togglePageRemoval = (pageIdx: number) => {
    setSelectedForRemoval((prev) => {
      const next = new Set(prev);
      if (next.has(pageIdx)) next.delete(pageIdx);
      else next.add(pageIdx);
      return next;
    });
  };

  const handleRemovePages = async () => {
    if (!file || selectedForRemoval.size === 0) return;
    if (selectedForRemoval.size >= pageCount) {
      setErrorMessage('You cannot remove all pages. At least one page must remain in the document.');
      return;
    }

    try {
      setStatus('processing');
      setErrorMessage(null);
      const outBytes = await removePages(file, Array.from(selectedForRemoval));
      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        fileName: `${file.name.replace(/\.pdf$/i, '')}_cleaned.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to remove pages.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setThumbnails([]);
    setSelectedForRemoval(new Set());
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'loadingDoc') {
    return <ProcessingState message="Generating thumbnails..." step="Loading all pages for visual selection" />;
  }

  if (status === 'processing') {
    return <ProcessingState message="Removing selected pages..." step="Re-indexing and generating cleaned PDF" />;
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Remove Pages" />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF to remove pages"
          subtitle="Click unwanted pages visually to remove them permanently"
        />
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Click pages to mark for removal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedForRemoval.size} of {pageCount} {selectedForRemoval.size === 1 ? 'page' : 'pages'} marked to delete
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedForRemoval.size > 0 && (
                <button
                  onClick={() => setSelectedForRemoval(new Set())}
                  className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Deselect All
                </button>
              )}
              <button
                onClick={handleReset}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Page Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {thumbnails.map((src, idx) => {
              const isMarked = selectedForRemoval.has(idx);
              return (
                <div
                  key={idx}
                  onClick={() => togglePageRemoval(idx)}
                  className={`group relative p-3 rounded-2xl border cursor-pointer transition-all duration-200 text-center select-none ${
                    isMarked
                      ? 'border-red-500 bg-red-50/60 dark:bg-red-950/40 ring-2 ring-red-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400'
                  }`}
                >
                  {/* Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    {isMarked ? (
                      <span className="p-1 rounded-lg bg-red-600 text-white shadow-sm flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 group-hover:border-slate-400 block" />
                    )}
                  </div>

                  <img
                    src={src}
                    alt={`Page ${idx + 1}`}
                    className={`w-full h-36 object-contain rounded-lg bg-white shadow-sm ${
                      isMarked ? 'opacity-40 grayscale' : 'opacity-100'
                    }`}
                  />

                  <span
                    className={`text-xs font-mono font-bold block mt-2 ${
                      isMarked ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Page {idx + 1} {isMarked ? '(Delete)' : ''}
                  </span>
                </div>
              );
            })}
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
              variant="danger"
              size="lg"
              leftIcon={<Trash2 className="w-5 h-5" />}
              onClick={handleRemovePages}
              className="w-full text-base py-4"
              disabled={selectedForRemoval.size === 0 || selectedForRemoval.size >= pageCount}
            >
              {selectedForRemoval.size === 0
                ? 'Select Pages to Remove'
                : `Remove ${selectedForRemoval.size} ${selectedForRemoval.size === 1 ? 'Page' : 'Pages'} & Save PDF`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
