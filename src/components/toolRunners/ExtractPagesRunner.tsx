import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { extractPages } from '../../utils/pdfOps';
import { loadPdfJsDocument, getPageThumbnail } from '../../utils/pdfjs';
import { readFileAsArrayBuffer } from '../../utils/formatters';
import { ProcessResult } from '../../types';
import { FileSymlink, AlertCircle, CheckCircle2, Check } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export const ExtractPagesRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedToKeep, setSelectedToKeep] = useState<Set<number>>(new Set());
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

      // Pre-select page 1
      setSelectedToKeep(new Set([0]));
      setStatus('idle');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Could not load PDF document.');
    }
  };

  const togglePageSelection = (pageIdx: number) => {
    setSelectedToKeep((prev) => {
      const next = new Set(prev);
      if (next.has(pageIdx)) next.delete(pageIdx);
      else next.add(pageIdx);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedToKeep(new Set(Array.from({ length: pageCount }, (_, i) => i)));
  };

  const handleExtractPages = async () => {
    if (!file || selectedToKeep.size === 0) return;

    try {
      setStatus('processing');
      setErrorMessage(null);
      const sortedIndices = Array.from(selectedToKeep).sort((a, b) => a - b);
      const outBytes = await extractPages(file, sortedIndices);
      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        fileName: `${file.name.replace(/\.pdf$/i, '')}_extracted.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to extract pages.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setThumbnails([]);
    setSelectedToKeep(new Set());
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'loadingDoc') {
    return <ProcessingState message="Loading pages..." step="Rendering thumbnails for selection" />;
  }

  if (status === 'processing') {
    return <ProcessingState message="Extracting pages..." step="Compiling selected pages into new PDF" />;
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Extract Pages" />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF to extract pages"
          subtitle="Choose any pages you want to save into a new separate document"
        />
      ) : (
        <div className="space-y-6">
          {/* Top Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Select pages to extract
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedToKeep.size} of {pageCount} {selectedToKeep.size === 1 ? 'page' : 'pages'} chosen
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedToKeep(new Set())}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Deselect All
              </button>
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
              const isSelected = selectedToKeep.has(idx);
              return (
                <div
                  key={idx}
                  onClick={() => togglePageSelection(idx)}
                  className={`group relative p-3 rounded-2xl border cursor-pointer transition-all duration-200 text-center select-none ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 opacity-60'
                  }`}
                >
                  <div className="absolute top-2 right-2 z-10">
                    {isSelected ? (
                      <span className="p-1 rounded-lg bg-brand-600 text-white shadow-sm flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 block" />
                    )}
                  </div>

                  <img
                    src={src}
                    alt={`Page ${idx + 1}`}
                    className="w-full h-36 object-contain rounded-lg bg-white shadow-sm"
                  />

                  <span
                    className={`text-xs font-mono font-bold block mt-2 ${
                      isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'
                    }`}
                  >
                    Page {idx + 1}
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
              variant="primary"
              size="lg"
              leftIcon={<FileSymlink className="w-5 h-5" />}
              onClick={handleExtractPages}
              className="w-full text-base py-4"
              disabled={selectedToKeep.size === 0}
            >
              {selectedToKeep.size === 0
                ? 'Select at least 1 page'
                : `Extract ${selectedToKeep.size} ${selectedToKeep.size === 1 ? 'Page' : 'Pages'} to New PDF`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
