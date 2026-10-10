import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { organizePdf } from '../../utils/pdfOps';
import { loadPdfJsDocument, getPageThumbnail } from '../../utils/pdfjs';
import { readFileAsArrayBuffer } from '../../utils/formatters';
import { ProcessResult } from '../../types';
import {
  RotateCw,
  Trash2,
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  AlertCircle,
  FileCheck,
  FileText,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface PageItem {
  originalIndex: number;
  thumbnail: string | null;
  rotation: number;
}

export const OrganizePdfRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
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
        const initialItems: PageItem[] = Array.from({ length: total }, (_, i) => ({
          originalIndex: i,
          thumbnail: null,
          rotation: 0,
        }));
        setPages(initialItems);
      } catch {
        // fallback
      }

      try {
        const pdfJsDoc = await loadPdfJsDocument(buffer);
        if (!total) {
          total = pdfJsDoc.numPages;
          const initialItems: PageItem[] = Array.from({ length: total }, (_, i) => ({
            originalIndex: i,
            thumbnail: null,
            rotation: 0,
          }));
          setPages(initialItems);
        }

        const maxThumbs = Math.min(total, 60);
        for (let i = 1; i <= maxThumbs; i++) {
          try {
            const thumb = await getPageThumbnail(pdfJsDoc, i, 180);
            setPages((prev) =>
              prev.map((p, idx) => (idx === i - 1 ? { ...p, thumbnail: thumb } : p))
            );
          } catch {
            // continue
          }
        }
      } catch {
        // thumbnails optional
      }

      setStatus('idle');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Could not load PDF document.');
    }
  };

  const moveLeft = (index: number) => {
    if (index === 0) return;
    const copy = [...pages];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    setPages(copy);
  };

  const moveRight = (index: number) => {
    if (index === pages.length - 1) return;
    const copy = [...pages];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    setPages(copy);
  };

  const rotatePage = (index: number) => {
    const copy = [...pages];
    copy[index] = {
      ...copy[index],
      rotation: (copy[index].rotation + 90) % 360,
    };
    setPages(copy);
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      setErrorMessage('Cannot delete the last remaining page.');
      return;
    }
    setPages(pages.filter((_, i) => i !== index));
  };

  const handleExport = async () => {
    if (!file || pages.length === 0) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      const pageOrder = pages.map((p) => p.originalIndex);
      const rotationsMap: Record<number, number> = {};
      pages.forEach((p) => {
        if (p.rotation !== 0) {
          rotationsMap[p.originalIndex] = p.rotation;
        }
      });

      const outBytes = await organizePdf(file, pageOrder, rotationsMap);
      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        fileName: `${file.name.replace(/\.pdf$/i, '')}_organized.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to organize and export PDF.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'loadingDoc') {
    return <ProcessingState message="Loading pages..." step="Rendering interactive thumbnail organizer" />;
  }

  if (status === 'processing') {
    return <ProcessingState message="Saving organized PDF..." step="Applying custom page sequence and rotations" />;
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Organized PDF" />;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF to organize"
          subtitle="Reorder, rotate, or delete individual pages visually"
        />
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Visual Page Organizer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {pages.length} {pages.length === 1 ? 'page' : 'pages'} in current document
              </p>
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              Change File
            </button>
          </div>

          {/* Page Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pages.map((p, idx) => (
              <div
                key={`${p.originalIndex}-${idx}`}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col justify-between"
              >
                {/* Header with page number */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Pos #{idx + 1}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (Orig #{p.originalIndex + 1})
                  </span>
                </div>

                {/* Thumbnail with live CSS rotation */}
                <div className="w-full h-44 flex items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 overflow-hidden">
                  {p.thumbnail ? (
                    <img
                      src={p.thumbnail}
                      alt={`Page ${idx + 1}`}
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                      className="max-h-full max-w-full object-contain rounded transition-transform duration-300 shadow-sm"
                    />
                  ) : (
                    <div
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                      className="flex flex-col items-center justify-center text-slate-400 gap-1"
                    >
                      <FileText className="w-8 h-8" />
                      <span className="text-[10px] font-mono font-bold">
                        Page {p.originalIndex + 1}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions row: Move left, Rotate 90, Delete, Move right */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveLeft(idx)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move left"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveRight(idx)}
                      disabled={idx === pages.length - 1}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move right"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => rotatePage(idx)}
                      className="p-1.5 rounded-lg text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/60 transition-colors"
                      title="Rotate 90° clockwise"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePage(idx)}
                      disabled={pages.length <= 1}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 disabled:opacity-30 transition-colors"
                      title="Delete page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Export Action */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<LayoutGrid className="w-5 h-5" />}
              onClick={handleExport}
              className="w-full text-base py-4"
            >
              Export Organized PDF ({pages.length} Pages)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
