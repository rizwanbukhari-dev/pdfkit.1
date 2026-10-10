import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { addWatermark } from '../../utils/pdfOps';
import { ProcessResult } from '../../types';
import { Stamp, AlertCircle, FileText } from 'lucide-react';

export const AddWatermarkRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>('CONFIDENTIAL');
  const [position, setPosition] = useState<'diagonal' | 'center' | 'bottom'>('diagonal');
  const [opacity, setOpacity] = useState<number>(0.3);
  const [fontSize, setFontSize] = useState<number>(48);
  const [rotation, setRotation] = useState<number>(45);
  const [colorHex, setColorHex] = useState<string>('#64748b');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setErrorMessage(null);
  };

  const handleApply = async () => {
    if (!file || !text.trim()) {
      setErrorMessage('Please enter watermark text.');
      return;
    }

    try {
      setStatus('processing');
      setErrorMessage(null);

      const outBytes = await addWatermark(file, {
        text: text.trim(),
        opacity,
        fontSize,
        rotation,
        colorHex,
        position,
      });

      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        fileName: `${file.name.replace(/\.pdf$/i, '')}_watermarked.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to add watermark to PDF.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setText('CONFIDENTIAL');
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'processing') {
    return <ProcessingState message="Adding watermark..." step="Stamping watermark text with chosen opacity and angles" />;
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Watermarked PDF" />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF to watermark"
          subtitle="Stamp text watermarks across all pages with customizable rotation and transparency"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate max-w-xs sm:max-w-md">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Watermark Configuration</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              Change File
            </button>
          </div>

          {/* Live Preview Box */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono block">
              Live Watermark Preview
            </span>
            <div className="w-64 h-80 mx-auto rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-4 border border-dashed border-slate-300 dark:border-slate-700 pointer-events-none rounded opacity-40" />
              <span
                style={{
                  opacity,
                  transform: `rotate(${position === 'diagonal' ? 45 : rotation}deg)`,
                  color: colorHex,
                  fontSize: `${fontSize * 0.6}px`,
                }}
                className="font-extrabold select-none whitespace-nowrap tracking-widest"
              >
                {text || 'WATERMARK'}
              </span>
            </div>
          </div>

          {/* Watermark Parameters */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4 text-xs">
            {/* Stylish Preset Chips */}
            <div className="space-y-1.5">
              <label className="block font-bold uppercase tracking-wider text-slate-500 font-mono">
                Stylish Presets
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { text: 'CONFIDENTIAL', color: '#dc2626' },
                  { text: 'DRAFT', color: '#2563eb' },
                  { text: 'APPROVED', color: '#059669' },
                  { text: 'DO NOT COPY', color: '#475569' },
                  { text: 'PRIVATE', color: '#7c3aed' },
                ].map((preset) => (
                  <button
                    key={preset.text}
                    type="button"
                    onClick={() => {
                      setText(preset.text);
                      setColorHex(preset.color);
                    }}
                    className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs transition-all ${
                      text === preset.text
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {preset.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Watermark Text */}
            <div className="space-y-1.5">
              <label className="block font-bold uppercase tracking-wider text-slate-500 font-mono">
                Custom Watermark Text
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. CONFIDENTIAL, DRAFT, DO NOT COPY"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            {/* Color Swatches */}
            <div className="space-y-1.5">
              <label className="block font-bold uppercase tracking-wider text-slate-500 font-mono">
                Watermark Color Palette
              </label>
              <div className="flex items-center gap-2">
                {[
                  { color: '#dc2626', name: 'Security Red' },
                  { color: '#475569', name: 'Classic Slate' },
                  { color: '#2563eb', name: 'Royal Blue' },
                  { color: '#059669', name: 'Emerald Green' },
                  { color: '#7c3aed', name: 'Violet Purple' },
                  { color: '#db2777', name: 'Rose Pink' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setColorHex(c.color)}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      colorHex === c.color ? 'scale-125 ring-2 ring-brand-500 ring-offset-2' : 'opacity-85 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <label className="block font-bold uppercase tracking-wider text-slate-500 font-mono">
                Position
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['diagonal', 'center', 'bottom'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => {
                      setPosition(pos);
                      if (pos === 'diagonal') setRotation(45);
                      else if (pos === 'center') setRotation(0);
                    }}
                    className={`p-2.5 rounded-xl border font-semibold capitalize transition-all ${
                      position === pos
                        ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders for Opacity and Font Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span>Opacity</span>
                  <span className="font-mono">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span>Font Size</span>
                  <span className="font-mono">{fontSize}pt</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="2"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
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

          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Stamp className="w-5 h-5" />}
              onClick={handleApply}
              className="w-full text-base py-4"
              disabled={!text.trim()}
            >
              Apply Watermark & Download
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
