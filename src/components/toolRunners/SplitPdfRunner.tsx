import React, { useState, useEffect } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { extractPages } from '../../utils/pdfOps';
import { loadPdfJsDocument, getPageThumbnail } from '../../utils/pdfjs';
import { readFileAsArrayBuffer, parsePageRanges } from '../../utils/formatters';
import { ProcessResult } from '../../types';
import { Scissors, AlertCircle, Layers, Archive, FileText, Check } from 'lucide-react';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';

export const SplitPdfRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [rangeInput, setRangeInput] = useState<string>('1');
  const [splitMode, setSplitMode] = useState<'range' | 'all'>('range');
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
        setRangeInput(`1-${Math.min(total, 3)}`);
      } catch {
        // fallback
      }

      try {
        const pdfJsDoc = await loadPdfJsDocument(buffer);
        if (!total) {
          total = pdfJsDoc.numPages;
          setPageCount(total);
          setRangeInput(`1-${Math.min(total, 3)}`);
        }

        const thumbs: string[] = [];
        const loadCount = Math.min(total, 12);
        for (let i = 1; i <= loadCount; i++) {
          try {
            const thumb = await getPageThumbnail(pdfJsDoc, i, 160);
            thumbs.push(thumb);
          } catch {
            // continue
          }
        }
        setThumbnails(thumbs);
      } catch {
        // thumbnails optional
      }
      setStatus('idle');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Could not load PDF document.');
    }
  };

  const handleProcessSplit = async () => {
    if (!file || pageCount === 0) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      if (splitMode === 'range') {
        const selectedIndices = parsePageRanges(rangeInput, pageCount);
        if (selectedIndices.length === 0) {
          throw new Error('Please enter valid page numbers within the document range.');
        }

        const outBytes = await extractPages(file, selectedIndices);
        const blob = new Blob([outBytes as any], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);

        setResult({
          fileName: `split_${file.name.replace(/\.pdf$/i, '')}_pages.pdf`,
          fileSize: blob.size,
          downloadUrl,
          blob,
        });
      } else {
        // Split into individual pages & package into ZIP
        const zip = new JSZip();
        for (let i = 0; i < pageCount; i++) {
          const pageBytes = await extractPages(file, [i]);
          zip.file(`page_${i + 1}.pdf`, pageBytes as any);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const downloadUrl = URL.createObjectURL(zipBlob);

        setResult({
          fileName: `${file.name.replace(/\.pdf$/i, '')}_all_pages.zip`,
          fileSize: zipBlob.size,
          downloadUrl,
          blob: zipBlob,
        });
      }

      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to split PDF document.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setThumbnails([]);
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'loadingDoc') {
    return <ProcessingState message="Loading PDF..." step="Reading document pages and thumbnails" />;
  }

  if (status === 'processing') {
    return (
      <ProcessingState
        message="Splitting PDF..."
        step={splitMode === 'all' ? 'Extracting each page into individual files' : 'Extracting selected page range'}
      />
    );
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Split PDF" />;
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF to split"
          subtitle="Extract specific page ranges or split entire PDF into individual pages"
        />
      ) : (
        <div className="space-y-6">
          {/* Header File Info */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate max-w-md">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total {pageCount} {pageCount === 1 ? 'page' : 'pages'} detected
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

          {/* Split Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setSplitMode('range')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                splitMode === 'range'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-500" />
                  <span>Custom Page Range</span>
                </span>
                {splitMode === 'range' && <Check className="w-4 h-4 text-brand-600" />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Extract specific pages or segments into one PDF (e.g. 1-3, 5).
              </p>
            </div>

            <div
              onClick={() => setSplitMode('all')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                splitMode === 'all'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Archive className="w-4 h-4 text-brand-500" />
                  <span>Split into All Pages (ZIP)</span>
                </span>
                {splitMode === 'all' && <Check className="w-4 h-4 text-brand-600" />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Separate every single page into individual PDFs packed in a ZIP.
              </p>
            </div>
          </div>

          {/* Range Options */}
          {splitMode === 'range' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono">
                Page Range to Extract (1 to {pageCount})
              </label>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder={`Example: 1-${Math.min(pageCount, 2)}, ${pageCount}`}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-slate-400">
                Use commas to separate single pages, and hyphens for ranges (e.g. &ldquo;1-3, 5, 7&rdquo;).
              </p>
            </div>
          )}

          {/* Thumbnail preview carousel */}
          {thumbnails.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono block">
                Page Previews
              </span>
              <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
                {thumbnails.map((src, i) => (
                  <div
                    key={i}
                    className="shrink-0 w-24 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm"
                  >
                    <img
                      src={src}
                      alt={`Page ${i + 1}`}
                      className="w-full h-28 object-contain rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800"
                    />
                    <span className="text-[11px] font-mono font-medium text-slate-500 block mt-1.5">
                      Page {i + 1}
                    </span>
                  </div>
                ))}
                {pageCount > thumbnails.length && (
                  <div className="shrink-0 w-24 h-36 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400 font-medium">
                    +{pageCount - thumbnails.length} more
                  </div>
                )}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Process Button */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Scissors className="w-5 h-5" />}
              onClick={handleProcessSplit}
              className="w-full text-base py-4"
            >
              {splitMode === 'range' ? 'Extract Selected Range' : `Split All ${pageCount} Pages (ZIP)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
