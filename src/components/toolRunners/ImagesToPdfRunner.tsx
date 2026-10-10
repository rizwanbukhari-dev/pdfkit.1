import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { imagesToPdf } from '../../utils/pdfOps';
import { formatBytes } from '../../utils/formatters';
import { ProcessResult } from '../../types';
import {
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  FileText,
  AlertCircle,
  Settings2,
} from 'lucide-react';

interface ImagesToPdfProps {
  imageFormat: 'jpg' | 'png';
}

export const ImagesToPdfRunner: React.FC<ImagesToPdfProps> = ({ imageFormat }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'auto'>('auto');
  const [pageSize, setPageSize] = useState<'a4' | 'fit' | 'letter'>('a4');
  const [margin, setMargin] = useState<number>(20);
  const [outputFileName, setOutputFileName] = useState<string>(`${imageFormat}_document`);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setErrorMessage(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const fCopy = [...files];
    const pCopy = [...previews];
    [fCopy[index - 1], fCopy[index]] = [fCopy[index], fCopy[index - 1]];
    [pCopy[index - 1], pCopy[index]] = [pCopy[index], pCopy[index - 1]];
    setFiles(fCopy);
    setPreviews(pCopy);
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    const fCopy = [...files];
    const pCopy = [...previews];
    [fCopy[index + 1], fCopy[index]] = [fCopy[index], fCopy[index + 1]];
    [pCopy[index + 1], pCopy[index]] = [pCopy[index], pCopy[index + 1]];
    setFiles(fCopy);
    setPreviews(pCopy);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      const outBytes = await imagesToPdf(files, {
        orientation,
        pageSize,
        margin,
      });

      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const cleanName = outputFileName.trim() || `${imageFormat}_document`;
      setResult({
        fileName: `${cleanName.replace(/\.pdf$/i, '')}.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to convert images to PDF.');
    }
  };

  const handleReset = () => {
    previews.forEach((p) => URL.revokeObjectURL(p));
    setFiles([]);
    setPreviews([]);
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  const accepted = imageFormat === 'jpg' ? '.jpg,.jpeg,image/jpeg' : '.png,image/png';
  const formatTitle = imageFormat.toUpperCase();

  if (status === 'processing') {
    return (
      <ProcessingState
        message={`Converting ${files.length} images to PDF...`}
        step="Embedding images into standard document pages"
      />
    );
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName={`${formatTitle} to PDF`} />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {files.length === 0 ? (
        <UploadArea
          accept={accepted}
          multiple={true}
          onFilesSelected={handleFilesSelected}
          title={`Select or drop ${formatTitle} images`}
          subtitle={`Upload one or more ${formatTitle} images to combine them into a single PDF`}
        />
      ) : (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {files.length} {formatTitle} {files.length === 1 ? 'image' : 'images'} selected
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Reorder images and customize PDF layout options below
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors">
                <Plus className="w-4 h-4" />
                <span>Add More Images</span>
                <input
                  type="file"
                  accept={accepted}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                    e.target.value = '';
                  }}
                />
              </label>

              <button
                onClick={handleReset}
                className="px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* PDF Layout Settings */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              <Settings2 className="w-4 h-4 text-brand-500" />
              <span>Layout & Formatting Options</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Page Size */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Page Format</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500"
                >
                  <option value="a4">A4 (Standard)</option>
                  <option value="letter">US Letter</option>
                  <option value="fit">Fit (Same as image)</option>
                </select>
              </div>

              {/* Orientation */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Orientation</label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500"
                >
                  <option value="auto">Auto (Match image)</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              {/* Margin */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Margin</label>
                <select
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500"
                >
                  <option value={0}>No Margin</option>
                  <option value={20}>Small Margin (20pt)</option>
                  <option value={40}>Large Margin (40pt)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Image List Preview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col justify-between"
              >
                <div className="w-full h-36 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                  <img
                    src={previews[idx]}
                    alt={file.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="mt-2.5">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    #{idx + 1} {file.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {formatBytes(file.size)}
                  </p>
                </div>

                {/* Reorder and remove buttons */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveUp(idx)}
                      disabled={idx === 0}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveDown(idx)}
                      disabled={idx === files.length - 1}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1 rounded-md text-slate-400 hover:text-red-500"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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

          {/* Output File Name Field */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft text-left space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
              Output File Name
            </label>
            <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus-within:ring-2 focus-within:ring-brand-500 overflow-hidden shadow-xs">
              <input
                type="text"
                value={outputFileName}
                onChange={(e) => setOutputFileName(e.target.value)}
                placeholder={`e.g. ${imageFormat}_document`}
                className="w-full px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-transparent outline-none font-semibold"
              />
              <span className="pr-3 pl-2.5 py-2.5 text-xs font-mono text-slate-500 dark:text-slate-400 font-bold select-none bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
                .pdf
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Customize the name of your generated PDF (you can also rename it after converting).
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<FileText className="w-5 h-5" />}
              onClick={handleConvert}
              className="w-full text-base py-4"
            >
              Convert {files.length} {formatTitle} {files.length === 1 ? 'Image' : 'Images'} to PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
