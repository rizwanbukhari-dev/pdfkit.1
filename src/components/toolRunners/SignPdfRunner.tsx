import React, { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { signPdf } from '../../utils/pdfOps';
import { loadPdfJsDocument, getPageThumbnail } from '../../utils/pdfjs';
import { readFileAsArrayBuffer } from '../../utils/formatters';
import { ProcessResult } from '../../types';
import { PenTool, Type, Eraser, Check, AlertCircle, FileText, Move } from 'lucide-react';

export const SignPdfRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(1);
  const [targetPage, setTargetPage] = useState<number>(1);
  const [pageThumbnail, setPageThumbnail] = useState<string | null>(null);
  const [signMode, setSignMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState<string>('John Doe');
  const [penColor, setPenColor] = useState<string>('#1e293b'); // dark slate
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Placement percentages on page
  const [sigX, setSigX] = useState<number>(0.2); // 20% from left
  const [sigY, setSigY] = useState<number>(0.7); // 70% from top
  const [sigScale, setSigScale] = useState<number>(0.25); // 25% of page width

  const [status, setStatus] = useState<'idle' | 'loadingDoc' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  // Drawing canvas ref
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load PDF document on upload
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

      const thumb = await getPageThumbnail(pdfJsDoc, 1, 500);
      setPageThumbnail(thumb);
      setStatus('idle');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Could not load PDF document.');
    }
  };

  // Change target page
  const handlePageChange = async (newPage: number) => {
    if (!file) return;
    setTargetPage(newPage);
    try {
      const buffer = await readFileAsArrayBuffer(file);
      const pdfJsDoc = await loadPdfJsDocument(buffer);
      const thumb = await getPageThumbnail(pdfJsDoc, newPage, 500);
      setPageThumbnail(thumb);
    } catch (e) {
      console.error(e);
    }
  };

  // Draw signature canvas handlers
  const startDrawing = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    updateSignatureDataUrl();
  };

  const clearCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  // Create signature image from drawn canvas or typed text
  const updateSignatureDataUrl = () => {
    if (signMode === 'draw') {
      const canvas = drawCanvasRef.current;
      if (canvas) {
        setSignatureDataUrl(canvas.toDataURL('image/png'));
      }
    } else {
      // Generate typed cursive signature canvas
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '64px Caveat, cursive';
        ctx.fillStyle = penColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName, 200, 80);
        setSignatureDataUrl(canvas.toDataURL('image/png'));
      }
    }
  };

  useEffect(() => {
    if (signMode === 'type') {
      updateSignatureDataUrl();
    }
  }, [signMode, typedName, penColor]);

  // Handle PDF signing and export
  const handleExportSigned = async () => {
    if (!file || !signatureDataUrl) {
      setErrorMessage('Please create a signature first.');
      return;
    }

    try {
      setStatus('processing');
      setErrorMessage(null);

      const heightPct = sigScale * 0.45; // aspect ratio of signature box
      const signedBytes = await signPdf(file, signatureDataUrl, targetPage, {
        xPct: sigX,
        yPct: sigY,
        widthPct: sigScale,
        heightPct,
      });

      const blob = new Blob([signedBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        fileName: `${file.name.replace(/\.pdf$/i, '')}_signed.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to embed signature into PDF.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setSignatureDataUrl(null);
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'loadingDoc') {
    return <ProcessingState message="Loading PDF..." step="Rendering page preview for signature placement" />;
  }

  if (status === 'processing') {
    return <ProcessingState message="Signing document..." step="Burning cryptographic vector signature into target page" />;
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Signed PDF" />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF to sign"
          subtitle="Draw or type your signature and visually place it anywhere on any page"
        />
      ) : (
        <div className="space-y-6">
          {/* Header File Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate max-w-xs sm:max-w-md">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total {pageCount} {pageCount === 1 ? 'page' : 'pages'} • Signing Page {targetPage}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {pageCount > 1 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium">Page:</span>
                  <select
                    value={targetPage}
                    onChange={(e) => handlePageChange(Number(e.target.value))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                      <option key={p} value={p}>
                        Page {p}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleReset}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Signature Studio Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Signature Creation Pad */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  1. Create Signature
                </span>
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => {
                      setSignMode('draw');
                      setSignatureDataUrl(null);
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      signMode === 'draw'
                        ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    Draw
                  </button>
                  <button
                    onClick={() => setSignMode('type')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      signMode === 'type'
                        ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    Type
                  </button>
                </div>
              </div>

              {signMode === 'draw' ? (
                <div className="space-y-3">
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white shadow-inner relative">
                    <canvas
                      ref={drawCanvasRef}
                      width={400}
                      height={160}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-40 cursor-crosshair touch-none"
                    />
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                      <button
                        onClick={clearCanvas}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1 shadow-sm"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                        Clear
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">
                    Draw with mouse or fingertip on touchscreens
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Type your full name..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 flex items-center justify-center h-28">
                    <span
                      style={{ color: penColor, fontFamily: 'Caveat, cursive' }}
                      className="text-4xl select-none"
                    >
                      {typedName || 'Your Signature'}
                    </span>
                  </div>
                </div>
              )}

              {/* Ink color picker */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Ink Color:</span>
                <div className="flex items-center gap-2">
                  {[
                    { color: '#1e293b', label: 'Dark Slate' },
                    { color: '#1d4ed8', label: 'Blue' },
                    { color: '#047857', label: 'Emerald' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setPenColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        penColor === c.color ? 'scale-125 ring-2 ring-brand-500 ring-offset-1' : 'opacity-80'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Interactive Page Preview & Signature Placement */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  2. Position Signature (Page {targetPage})
                </span>
                <span className="text-[11px] text-slate-400">Click preview to place</span>
              </div>

              {/* Page Visual Canvas */}
              {pageThumbnail && (
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width;
                    const y = (e.clientY - rect.top) / rect.height;
                    setSigX(Math.max(0, Math.min(1 - sigScale, x - sigScale / 2)));
                    setSigY(Math.max(0, Math.min(0.9, y - 0.05)));
                  }}
                  className="relative w-full h-80 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden cursor-crosshair select-none"
                >
                  <img
                    src={pageThumbnail}
                    alt="Page preview"
                    className="max-h-full max-w-full object-contain pointer-events-none"
                  />

                  {/* Placed Signature box overlay */}
                  {signatureDataUrl && (
                    <div
                      style={{
                        left: `${sigX * 100}%`,
                        top: `${sigY * 100}%`,
                        width: `${sigScale * 100}%`,
                      }}
                      className="absolute p-1 border-2 border-dashed border-brand-500 bg-brand-500/10 rounded pointer-events-none transition-all duration-75 flex items-center justify-center shadow-lg"
                    >
                      <img
                        src={signatureDataUrl}
                        alt="Signature"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Sliders for scale and positioning */}
              <div className="space-y-3 pt-1 text-xs">
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span>Signature Size</span>
                  <span className="font-mono">{Math.round(sigScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.5"
                  step="0.02"
                  value={sigScale}
                  onChange={(e) => setSigScale(parseFloat(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>
            </div>
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
              leftIcon={<PenTool className="w-5 h-5" />}
              onClick={handleExportSigned}
              className="w-full text-base py-4"
              disabled={!signatureDataUrl}
            >
              Sign & Download Document
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
