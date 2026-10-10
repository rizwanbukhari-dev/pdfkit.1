import React, { useState, useRef, MouseEvent } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { redactPdf } from '../../utils/pdfOps';
import { loadPdfJsDocument, getPageThumbnail } from '../../utils/pdfjs';
import { readFileAsArrayBuffer } from '../../utils/formatters';
import { ProcessResult } from '../../types';
import { EyeOff, AlertCircle, FileText, Undo, Trash2, ShieldAlert } from 'lucide-react';

interface RedactionBox {
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}

export const RedactPdfRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(1);
  const [targetPage, setTargetPage] = useState<number>(1);
  const [pageThumbnail, setPageThumbnail] = useState<string | null>(null);
  const [redactions, setRedactions] = useState<RedactionBox[]>([]);
  const [status, setStatus] = useState<'idle' | 'loadingDoc' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  // Drawing state
  const [startPos, setStartPos] = useState<{ xPct: number; yPct: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<RedactionBox | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setStatus('loadingDoc');
    setErrorMessage(null);

    try {
      const buffer = await readFileAsArrayBuffer(selected);
      const pdfJsDoc = await loadPdfJsDocument(buffer);
      setPageCount(pdfJsDoc.numPages);
      setTargetPage(1);

      const thumb = await getPageThumbnail(pdfJsDoc, 1, 600);
      setPageThumbnail(thumb);
      setRedactions([]);
      setStatus('idle');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Could not load PDF document.');
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (!file) return;
    setTargetPage(newPage);
    try {
      const buffer = await readFileAsArrayBuffer(file);
      const pdfJsDoc = await loadPdfJsDocument(buffer);
      const thumb = await getPageThumbnail(pdfJsDoc, newPage, 600);
      setPageThumbnail(thumb);
      setRedactions([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    setStartPos({ xPct, yPct });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!startPos) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const curXPct = (e.clientX - rect.left) / rect.width;
    const curYPct = (e.clientY - rect.top) / rect.height;

    const left = Math.min(startPos.xPct, curXPct);
    const top = Math.min(startPos.yPct, curYPct);
    const width = Math.abs(curXPct - startPos.xPct);
    const height = Math.abs(curYPct - startPos.yPct);

    setCurrentBox({ xPct: left, yPct: top, widthPct: width, heightPct: height });
  };

  const handleMouseUp = () => {
    if (currentBox && currentBox.widthPct > 0.01 && currentBox.heightPct > 0.01) {
      setRedactions((prev) => [...prev, currentBox]);
    }
    setStartPos(null);
    setCurrentBox(null);
  };

  const undoLastRedaction = () => {
    setRedactions((prev) => prev.slice(0, -1));
  };

  const clearRedactions = () => {
    setRedactions([]);
  };

  const handleApplyRedactions = async () => {
    if (!file || redactions.length === 0) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      const outBytes = await redactPdf(file, targetPage, redactions);
      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        fileName: `${file.name.replace(/\.pdf$/i, '')}_redacted.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to apply redactions.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setRedactions([]);
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'loadingDoc') {
    return <ProcessingState message="Loading document..." step="Preparing visual redaction workspace" />;
  }

  if (status === 'processing') {
    return <ProcessingState message="Burning blackout redactions..." step="Permanently removing sensitive vector content" />;
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Redacted PDF" />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF to redact"
          subtitle="Click and drag blackout boxes to permanently censor confidential information"
        />
      ) : (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate max-w-xs sm:max-w-md">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Page {targetPage} of {pageCount} • {redactions.length} blackout areas marked
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {pageCount > 1 && (
                <select
                  value={targetPage}
                  onChange={(e) => handlePageChange(Number(e.target.value))}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                >
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                    <option key={p} value={p}>
                      Page {p}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={undoLastRedaction}
                disabled={redactions.length === 0}
                className="p-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 disabled:opacity-30 transition-colors"
                title="Undo last redaction"
              >
                <Undo className="w-4 h-4" />
              </button>

              <button
                onClick={clearRedactions}
                disabled={redactions.length === 0}
                className="p-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30 transition-colors"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={handleReset}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Interactive Redaction Canvas */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft text-center space-y-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono block">
              Drag over private text to censor it
            </span>

            {pageThumbnail && (
              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="relative max-w-xl mx-auto rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden cursor-crosshair select-none"
              >
                <img
                  src={pageThumbnail}
                  alt={`Page ${targetPage}`}
                  className="w-full h-auto pointer-events-none"
                />

                {/* Drawn Redaction Boxes */}
                {redactions.map((box, i) => (
                  <div
                    key={i}
                    style={{
                      left: `${box.xPct * 100}%`,
                      top: `${box.yPct * 100}%`,
                      width: `${box.widthPct * 100}%`,
                      height: `${box.heightPct * 100}%`,
                    }}
                    className="absolute bg-black shadow-md border border-neutral-700 pointer-events-none"
                  />
                ))}

                {/* Active in-progress drag box */}
                {currentBox && (
                  <div
                    style={{
                      left: `${currentBox.xPct * 100}%`,
                      top: `${currentBox.yPct * 100}%`,
                      width: `${currentBox.widthPct * 100}%`,
                      height: `${currentBox.heightPct * 100}%`,
                    }}
                    className="absolute bg-black/80 border-2 border-red-500 pointer-events-none"
                  />
                )}
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="danger"
              size="lg"
              leftIcon={<EyeOff className="w-5 h-5" />}
              onClick={handleApplyRedactions}
              className="w-full text-base py-4"
              disabled={redactions.length === 0}
            >
              {redactions.length === 0
                ? 'Draw Blackout Boxes Above'
                : `Burn ${redactions.length} Redactions & Download PDF`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
