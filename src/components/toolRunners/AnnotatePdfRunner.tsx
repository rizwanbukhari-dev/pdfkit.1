import React, { useState, MouseEvent } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { loadPdfJsDocument, getPageThumbnail } from '../../utils/pdfjs';
import { readFileAsArrayBuffer } from '../../utils/formatters';
import { ProcessResult } from '../../types';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { Highlighter, Stamp, FileText, AlertCircle, Sparkles } from 'lucide-react';

interface AnnotationMark {
  type: 'stamp' | 'highlight';
  text?: string;
  xPct: number;
  yPct: number;
  color: string;
}

export const AnnotatePdfRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [outputFileName, setOutputFileName] = useState('annotated_document');
  const [pageThumbnail, setPageThumbnail] = useState<string | null>(null);
  const [stampText, setStampText] = useState<'APPROVED' | 'CONFIDENTIAL' | 'DRAFT' | 'REVIEWED'>('APPROVED');
  const [activeTool, setActiveTool] = useState<'stamp' | 'highlight'>('stamp');
  const [marks, setMarks] = useState<AnnotationMark[]>([]);
  const [status, setStatus] = useState<'idle' | 'loadingDoc' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setOutputFileName(`${selected.name.replace(/\.pdf$/i, '')}_annotated`);
    setStatus('loadingDoc');
    setErrorMessage(null);

    try {
      const buffer = await readFileAsArrayBuffer(selected);
      const pdfJsDoc = await loadPdfJsDocument(buffer);
      const thumb = await getPageThumbnail(pdfJsDoc, 1, 600);
      setPageThumbnail(thumb);
      setMarks([
        { type: 'stamp', text: 'APPROVED', xPct: 0.6, yPct: 0.15, color: '#16a34a' }
      ]);
      setStatus('idle');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Could not load PDF document.');
    }
  };

  const handleCanvasClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;

    const color =
      activeTool === 'stamp'
        ? stampText === 'APPROVED' ? '#16a34a' : stampText === 'CONFIDENTIAL' ? '#dc2626' : '#2563eb'
        : '#facc15';

    setMarks((prev) => [
      ...prev,
      {
        type: activeTool,
        text: activeTool === 'stamp' ? stampText : 'HIGHLIGHT',
        xPct,
        yPct,
        color,
      },
    ]);
  };

  const handleSave = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      const buffer = await readFileAsArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();

      for (const m of marks) {
        const x = width * m.xPct;
        const y = height - (height * m.yPct) - 20;

        if (m.type === 'stamp' && m.text) {
          const isGreen = m.color.includes('16a34a');
          const isRed = m.color.includes('dc2626');
          const stampRgb = isGreen ? rgb(0.1, 0.6, 0.2) : isRed ? rgb(0.85, 0.1, 0.1) : rgb(0.1, 0.4, 0.85);

          // Stamp border & text
          page.drawRectangle({
            x: x - 6,
            y: y - 4,
            width: 140,
            height: 32,
            borderWidth: 2,
            borderColor: stampRgb,
            color: rgb(1, 1, 1),
            opacity: 0.85,
            rotate: degrees(-6),
          });

          page.drawText(m.text, {
            x: x + 6,
            y: y + 4,
            size: 16,
            font,
            color: stampRgb,
            rotate: degrees(-6),
          });
        } else if (m.type === 'highlight') {
          page.drawRectangle({
            x,
            y,
            width: 120,
            height: 18,
            color: rgb(1, 0.9, 0.2),
            opacity: 0.4,
          });
        }
      }

      const outBytes = await pdfDoc.save();
      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const cleanName = outputFileName.trim() || 'annotated_document';
      setResult({
        fileName: `${cleanName.replace(/\.pdf$/i, '')}.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to burn annotations into PDF.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setMarks([]);
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'loadingDoc') {
    return <ProcessingState message="Loading document..." step="Preparing annotation canvas" />;
  }

  if (status === 'processing') {
    return <ProcessingState message="Burning annotations..." step="Stamping markup and highlight layers" />;
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Annotated PDF" />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF to annotate"
          subtitle="Stamp APPROVED, CONFIDENTIAL, REVIEWED badges and add text highlights to your pages"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400 shrink-0">
                <Highlighter className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{marks.length} annotations placed</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors shrink-0"
            >
              Change File
            </button>
          </div>

          {/* Tools Palette */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTool('stamp')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                  activeTool === 'stamp'
                    ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border-brand-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Stamp className="w-4 h-4" />
                <span>Stamp Tool</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('highlight')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                  activeTool === 'highlight'
                    ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border-brand-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Highlighter className="w-4 h-4" />
                <span>Yellow Highlighter</span>
              </button>

              {activeTool === 'stamp' && (
                <div className="flex items-center gap-1.5 ml-auto">
                  {(['APPROVED', 'CONFIDENTIAL', 'DRAFT', 'REVIEWED'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStampText(s)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                        stampText === s
                          ? s === 'APPROVED'
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                            : s === 'CONFIDENTIAL'
                            ? 'bg-red-100 border-red-500 text-red-800'
                            : 'bg-blue-100 border-blue-500 text-blue-800'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Click anywhere on the preview below to position your {activeTool === 'stamp' ? stampText + ' stamp' : 'highlight'}.
            </p>
          </div>

          {/* Interactive Document Page Canvas */}
          <div className="flex justify-center p-4 rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-auto">
            {pageThumbnail && (
              <div
                onClick={handleCanvasClick}
                className="relative cursor-pointer shadow-2xl rounded-lg overflow-hidden select-none"
                style={{ maxHeight: '68vh' }}
              >
                <img
                  src={pageThumbnail}
                  alt="Page preview"
                  className="max-h-[68vh] object-contain block pointer-events-none"
                />

                {marks.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `${m.xPct * 100}%`,
                      top: `${m.yPct * 100}%`,
                    }}
                    className="transform -translate-x-1/2 -translate-y-1/2"
                  >
                    {m.type === 'stamp' ? (
                      <div
                        style={{ borderColor: m.color, color: m.color }}
                        className="px-3 py-1 font-extrabold text-xs tracking-wider border-2 rounded-lg bg-white/90 shadow-md transform -rotate-6 uppercase"
                      >
                        {m.text}
                      </div>
                    ) : (
                      <div className="w-24 h-4 bg-yellow-300/60 rounded shadow-xs" />
                    )}
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
              leftIcon={<Highlighter className="w-5 h-5" />}
              onClick={handleSave}
              className="w-full text-base py-4 font-bold shadow-lg shadow-brand-500/25"
            >
              Burn Annotations & Download PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
