import React, { useState, useRef, MouseEvent } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { loadPdfJsDocument, getPageThumbnail } from '../../utils/pdfjs';
import { readFileAsArrayBuffer } from '../../utils/formatters';
import { ProcessResult } from '../../types';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { FileEdit, Type, AlertCircle, Trash2, Plus, Sparkles, Check } from 'lucide-react';

interface TextAnnotation {
  id: string;
  text: string;
  xPct: number;
  yPct: number;
  fontSize: number;
  colorHex: string;
}

export const EditPdfRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [outputFileName, setOutputFileName] = useState('edited_document');
  const [pageCount, setPageCount] = useState<number>(1);
  const [targetPage, setTargetPage] = useState<number>(1);
  const [pageThumbnail, setPageThumbnail] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
  const [newText, setNewText] = useState<string>('Sample Text');
  const [fontSize, setFontSize] = useState<number>(14);
  const [colorHex, setColorHex] = useState<string>('#0f172a');
  const [status, setStatus] = useState<'idle' | 'loadingDoc' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setOutputFileName(`${selected.name.replace(/\.pdf$/i, '')}_edited`);
    setStatus('loadingDoc');
    setErrorMessage(null);

    try {
      const buffer = await readFileAsArrayBuffer(selected);
      const pdfJsDoc = await loadPdfJsDocument(buffer);
      setPageCount(pdfJsDoc.numPages);
      setTargetPage(1);

      const thumb = await getPageThumbnail(pdfJsDoc, 1, 600);
      setPageThumbnail(thumb);
      setAnnotations([]);
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
    } catch (e) {
      console.error(e);
    }
  };

  const handleCanvasClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!newText.trim()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;

    const newAnn: TextAnnotation = {
      id: Math.random().toString(36).substring(2, 9),
      text: newText.trim(),
      xPct,
      yPct,
      fontSize,
      colorHex,
    };
    setAnnotations((prev) => [...prev, newAnn]);
  };

  const removeAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      const buffer = await readFileAsArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const page = pdfDoc.getPage(targetPage - 1);
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();

      for (const ann of annotations) {
        const hex = ann.colorHex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255 || 0.1;
        const g = parseInt(hex.substring(2, 4), 16) / 255 || 0.1;
        const b = parseInt(hex.substring(4, 6), 16) / 255 || 0.1;

        const x = pageWidth * ann.xPct;
        const y = pageHeight - (pageHeight * ann.yPct) - ann.fontSize;

        page.drawText(ann.text, {
          x,
          y,
          size: ann.fontSize,
          font,
          color: rgb(r, g, b),
        });
      }

      const outBytes = await pdfDoc.save();
      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const cleanName = outputFileName.trim() || 'edited_document';
      setResult({
        fileName: `${cleanName.replace(/\.pdf$/i, '')}.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to apply edits to PDF.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setAnnotations([]);
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'loadingDoc') {
    return <ProcessingState message="Loading PDF..." step="Rendering interactive editor canvas" />;
  }

  if (status === 'processing') {
    return <ProcessingState message="Saving edits..." step="Burning text annotations permanently into PDF" />;
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Edited PDF" />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF to edit"
          subtitle="Add custom text blocks, labels, headers, and text annotations directly onto document pages"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                <FileEdit className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Page {targetPage} of {pageCount} • {annotations.length} text annotations
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors shrink-0"
            >
              Change File
            </button>
          </div>

          {/* Controls Bar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                Click anywhere on document to place text:
              </span>
              {pageCount > 1 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400">Target Page:</span>
                  <select
                    value={targetPage}
                    onChange={(e) => handlePageChange(Number(e.target.value))}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  >
                    {Array.from({ length: pageCount }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Page {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Text to Insert
                </label>
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Enter text..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="space-y-1 flex-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Font Size ({fontSize}pt)
                  </label>
                  <input
                    type="range"
                    min={9}
                    max={36}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                    Color
                  </label>
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Document Page Canvas */}
          <div className="flex justify-center p-4 rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-auto">
            {pageThumbnail && (
              <div
                onClick={handleCanvasClick}
                className="relative cursor-crosshair shadow-2xl rounded-lg overflow-hidden select-none max-w-full"
                style={{ maxHeight: '70vh' }}
              >
                <img
                  src={pageThumbnail}
                  alt={`Page ${targetPage}`}
                  className="max-h-[70vh] object-contain block pointer-events-none"
                />

                {annotations.map((ann) => (
                  <div
                    key={ann.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAnnotation(ann.id);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${ann.xPct * 100}%`,
                      top: `${ann.yPct * 100}%`,
                      color: ann.colorHex,
                      fontSize: `${ann.fontSize * 0.9}px`,
                      fontWeight: 'bold',
                    }}
                    className="group bg-yellow-100/70 dark:bg-yellow-950/70 px-1 rounded shadow-xs border border-yellow-400/50 cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors"
                    title="Click to remove"
                  >
                    <span>{ann.text}</span>
                    <span className="opacity-0 group-hover:opacity-100 text-[10px] ml-1 text-red-600">✕</span>
                  </div>
                ))}
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
              variant="primary"
              size="lg"
              leftIcon={<FileEdit className="w-5 h-5" />}
              onClick={handleSave}
              className="w-full text-base py-4 font-bold shadow-lg shadow-brand-500/25"
            >
              Save Edited PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
