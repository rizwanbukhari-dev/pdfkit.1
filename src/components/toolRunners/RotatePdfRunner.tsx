import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { rotatePdf } from '../../utils/pdfOps';
import { loadPdfJsDocument, getPageThumbnail } from '../../utils/pdfjs';
import { readFileAsArrayBuffer } from '../../utils/formatters';
import { ProcessResult } from '../../types';
import { PDFDocument } from 'pdf-lib';
import {
  RotateCw,
  RotateCcw,
  AlertCircle,
  FileText,
  Check,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

interface PageRotateItem {
  pageIndex: number;
  rotation: number; // delta in degrees: 0, 90, 180, 270
  thumbnail: string | null;
}

export const RotatePdfRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [outputFileName, setOutputFileName] = useState('rotated_document');
  const [pages, setPages] = useState<PageRotateItem[]>([]);
  const [targetScope, setTargetScope] = useState<'all' | 'odd' | 'even'>('all');
  const [status, setStatus] = useState<'idle' | 'loadingDoc' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setOutputFileName(`${selected.name.replace(/\.pdf$/i, '')}_rotated`);
    setStatus('loadingDoc');
    setErrorMessage(null);

    try {
      const buffer = await readFileAsArrayBuffer(selected);

      // 1. Get exact page count from pdf-lib (zero dependencies, instant)
      const pdfLibDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const totalPages = pdfLibDoc.getPageCount();

      // Initialize page items immediately so UI is responsive right away
      const initialPages: PageRotateItem[] = Array.from({ length: totalPages }, (_, i) => ({
        pageIndex: i,
        rotation: 0,
        thumbnail: null,
      }));
      setPages(initialPages);
      setStatus('idle');

      // 2. Asynchronously load thumbnails with pdf.js (non-blocking)
      try {
        const clonedBuffer = buffer.slice(0);
        const pdfJsDoc = await loadPdfJsDocument(clonedBuffer);
        const maxThumbnails = Math.min(totalPages, 60);
        for (let i = 1; i <= maxThumbnails; i++) {
          try {
            const thumb = await getPageThumbnail(pdfJsDoc, i, 200);
            setPages((prev) =>
              prev.map((p, idx) => (idx === i - 1 ? { ...p, thumbnail: thumb } : p))
            );
          } catch {
            // thumbnail generation failed for this page, continue
          }
        }
      } catch {
        // pdf.js thumbnail generation failed; page cards will display vector placeholders
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Could not load PDF document.');
    }
  };

  // Rotate pages in target scope (all, odd, even) by delta (+90 or -90 or +180)
  const rotateScope = (delta: number) => {
    setPages((prev) =>
      prev.map((p) => {
        const isTarget =
          targetScope === 'all' ||
          (targetScope === 'odd' && p.pageIndex % 2 === 0) || // 0-indexed: 0, 2, 4 are pages 1, 3, 5
          (targetScope === 'even' && p.pageIndex % 2 === 1);  // 0-indexed: 1, 3, 5 are pages 2, 4, 6

        if (!isTarget) return p;

        return {
          ...p,
          rotation: ((p.rotation + delta) % 360 + 360) % 360,
        };
      })
    );
  };

  // Rotate individual page by delta (+90 or -90)
  const rotateSinglePage = (pageIndex: number, delta: number) => {
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === pageIndex
          ? { ...p, rotation: ((p.rotation + delta) % 360 + 360) % 360 }
          : p
      )
    );
  };

  // Reset all rotations or individual page
  const resetAllRotations = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: 0 })));
  };

  const resetSinglePage = (pageIndex: number) => {
    setPages((prev) =>
      prev.map((p, idx) => (idx === pageIndex ? { ...p, rotation: 0 } : p))
    );
  };

  const handleApplyRotate = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      // Build rotation dictionary for each page
      const rotationsDict: Record<number, number> = {};
      pages.forEach((p) => {
        rotationsDict[p.pageIndex] = p.rotation;
      });

      const outBytes = await rotatePdf(file, 0, rotationsDict);
      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const cleanName = outputFileName.trim() || 'rotated_document';
      setResult({
        fileName: `${cleanName.replace(/\.pdf$/i, '')}.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to rotate PDF.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setTargetScope('all');
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  // Helper to format degree badge
  const getRotationBadgeText = (deg: number) => {
    if (deg === 0) return '0° (Original)';
    if (deg === 90) return '+90° CW';
    if (deg === 180) return '180° Flip';
    if (deg === 270) return '-90° CCW';
    return `${deg}°`;
  };

  const rotatedCount = pages.filter((p) => p.rotation !== 0).length;

  if (status === 'loadingDoc') {
    return <ProcessingState message="Loading PDF..." step="Reading document pages and building layout" />;
  }

  if (status === 'processing') {
    return <ProcessingState message="Applying page rotations..." step="Writing permanent rotation metadata to PDF stream" />;
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Rotated PDF" />;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF to rotate"
          subtitle="Rotate all pages or individual pages permanently by 90°, 180°, or 270°"
        />
      ) : (
        <div className="space-y-6">
          {/* File Info Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                  {file.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400 font-mono">
                    {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span
                    className={`text-xs font-semibold ${
                      rotatedCount > 0
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {rotatedCount > 0
                      ? `${rotatedCount} ${rotatedCount === 1 ? 'page' : 'pages'} modified`
                      : 'Original orientation'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
            >
              Change File
            </button>
          </div>

          {/* Quick Action Toolbar */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-brand-500" />
                  <span>Batch Rotation Controls</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Rotate all or specific pages at once, or use individual controls on each page below.
                </p>
              </div>

              {/* Target Scope Selector (All, Odd, Even) */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold select-none self-start md:self-auto">
                <span className="px-2 text-slate-400 text-[11px] uppercase font-mono">Scope:</span>
                <button
                  type="button"
                  onClick={() => setTargetScope('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    targetScope === 'all'
                      ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({pages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTargetScope('odd')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    targetScope === 'odd'
                      ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Odd Pages
                </button>
                <button
                  type="button"
                  onClick={() => setTargetScope('even')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    targetScope === 'even'
                      ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Even Pages
                </button>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => rotateScope(-90)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700 shadow-xs"
              >
                <RotateCcw className="w-4 h-4 text-brand-500" />
                <span>Rotate Left (-90°)</span>
              </button>

              <button
                type="button"
                onClick={() => rotateScope(90)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-brand-50 dark:bg-brand-950/80 hover:bg-brand-100 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 transition-colors border border-brand-200 dark:border-brand-800 shadow-xs"
              >
                <RotateCw className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Rotate Right (+90°)</span>
              </button>

              <button
                type="button"
                onClick={() => rotateScope(180)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
              >
                <span>Flip 180°</span>
              </button>

              <button
                type="button"
                onClick={resetAllRotations}
                disabled={rotatedCount === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto"
                title="Reset all rotations to 0°"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>
            </div>

            {/* Custom Output File Name */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono mb-1.5">
                Output File Name
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus-within:ring-2 focus-within:ring-brand-500 overflow-hidden shadow-xs">
                <input
                  type="text"
                  value={outputFileName}
                  onChange={(e) => setOutputFileName(e.target.value)}
                  placeholder="e.g. rotated_document"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-transparent outline-none font-semibold"
                />
                <span className="pr-3 pl-2.5 py-2.5 text-xs font-mono text-slate-500 dark:text-slate-400 font-bold select-none bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
                  .pdf
                </span>
              </div>
            </div>
          </div>

          {/* Page Grid Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono px-1">
              <span>All Pages ({pages.length})</span>
              <span>Click thumbnail or buttons to adjust rotation</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pages.map((p) => {
                const isModified = p.rotation !== 0;
                // Calculate scale factor so rotated portrait pages do not get cut off by container bounds
                const is90or270 = p.rotation % 180 !== 0;
                const scaleVal = is90or270 ? 0.72 : 1.0;

                return (
                  <div
                    key={p.pageIndex}
                    className={`group relative p-3 rounded-2xl bg-white dark:bg-slate-900 border transition-all text-center space-y-2.5 shadow-soft ${
                      isModified
                        ? 'border-brand-500/80 dark:border-brand-500 ring-2 ring-brand-500/15'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Thumbnail / Page Container */}
                    <div
                      onClick={() => rotateSinglePage(p.pageIndex, 90)}
                      className="w-full h-44 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center p-2 relative overflow-hidden cursor-pointer"
                      title="Click to rotate +90° clockwise"
                    >
                      {p.thumbnail ? (
                        <img
                          src={p.thumbnail}
                          alt={`Page ${p.pageIndex + 1}`}
                          style={{
                            transform: `rotate(${p.rotation}deg) scale(${scaleVal})`,
                            transition: 'transform 0.3s ease',
                          }}
                          className="max-h-full max-w-full object-contain rounded shadow-xs"
                        />
                      ) : (
                        <div
                          style={{
                            transform: `rotate(${p.rotation}deg) scale(${scaleVal})`,
                            transition: 'transform 0.3s ease',
                          }}
                          className="flex flex-col items-center justify-center text-slate-400 gap-1.5"
                        >
                          <FileText className="w-9 h-9" />
                          <span className="text-[10px] font-mono font-bold">
                            Page {p.pageIndex + 1}
                          </span>
                        </div>
                      )}

                      {/* Interactive Hover Overlay with Click Prompt */}
                      <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[0.5px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 rounded-full bg-white/95 dark:bg-slate-800/95 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-lg">
                          <RotateCw className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Page Label & Angle Badge */}
                    <div className="flex items-center justify-between text-xs font-semibold px-0.5">
                      <span className="text-slate-800 dark:text-slate-200">
                        Page {p.pageIndex + 1}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isModified
                            ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {getRotationBadgeText(p.rotation)}
                      </span>
                    </div>

                    {/* Dedicated Rotate Left & Right Action Buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          rotateSinglePage(p.pageIndex, -90);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                        title="Rotate counter-clockwise 90°"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>-90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          rotateSinglePage(p.pageIndex, 90);
                        }}
                        className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950 hover:bg-brand-100 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors border border-brand-200/50 dark:border-brand-800/50"
                        title="Rotate clockwise 90°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>+90°</span>
                      </button>
                    </div>

                    {isModified && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetSinglePage(p.pageIndex);
                        }}
                        className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 block w-full text-center transition-colors pt-0.5"
                      >
                        Reset to 0°
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Save & Download Action Button */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<RotateCw className="w-5 h-5" />}
              onClick={handleApplyRotate}
              className="w-full text-base py-4 font-bold shadow-lg shadow-brand-500/25"
            >
              {rotatedCount > 0
                ? `Save Rotated PDF (${rotatedCount} ${rotatedCount === 1 ? 'page' : 'pages'} modified)`
                : 'Save Rotated PDF'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
