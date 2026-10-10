import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { loadPdfJsDocument, renderPageToCanvas } from '../../utils/pdfjs';
import { readFileAsArrayBuffer } from '../../utils/formatters';
import { ProcessResult } from '../../types';
import { Image, Archive, AlertCircle, FileText, Download } from 'lucide-react';
import JSZip from 'jszip';

interface PdfToImagesProps {
  format: 'jpg' | 'png';
}

export const PdfToImagesRunner: React.FC<PdfToImagesProps> = ({ format }) => {
  const [file, setFile] = useState<File | null>(null);
  const [scale, setScale] = useState<number>(1.5);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setErrorMessage(null);
  };

  const handleConvert = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setProgress(5);
      setErrorMessage(null);

      const buffer = await readFileAsArrayBuffer(file);
      const pdfJsDoc = await loadPdfJsDocument(buffer);
      const totalPages = pdfJsDoc.numPages;

      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const extension = format === 'jpg' ? 'jpg' : 'png';
      const zip = new JSZip();

      const secondaryDownloads: { name: string; url: string; blob: Blob }[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const canvas = await renderPageToCanvas(pdfJsDoc, i, scale);

        // Convert canvas to Blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b || new Blob()), mimeType, 0.92);
        });

        const pageFileName = `${file.name.replace(/\.pdf$/i, '')}_page_${i}.${extension}`;
        zip.file(pageFileName, blob);

        secondaryDownloads.push({
          name: pageFileName,
          url: URL.createObjectURL(blob),
          blob,
        });

        setProgress(Math.round(((i / totalPages) * 90) + 5));
      }

      // Generate ZIP archive
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);

      setResult({
        fileName: `${file.name.replace(/\.pdf$/i, '')}_${format.toUpperCase()}_images.zip`,
        fileSize: zipBlob.size,
        downloadUrl,
        blob: zipBlob,
        secondaryDownloads,
      });

      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || `Failed to convert PDF to ${format.toUpperCase()}.`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
    setProgress(0);
  };

  const formatTitle = format.toUpperCase();

  if (status === 'processing') {
    return (
      <ProcessingState
        message={`Rendering pages as ${formatTitle}...`}
        step="Rasterizing vector page layers into high-resolution images"
        progress={progress}
      />
    );
  }

  if (status === 'success' && result) {
    return (
      <ResultCard
        result={result}
        onReset={handleReset}
        toolName={`PDF to ${formatTitle}`}
      />
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title={`Select a PDF to convert to ${formatTitle}`}
          subtitle={`Extract every page as a high-definition ${formatTitle} image`}
        />
      ) : (
        <div className="space-y-6">
          {/* File Info */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate max-w-xs sm:max-w-md">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to convert to {formatTitle}
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

          {/* Quality Options */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Image Resolution & Scale
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScale(1.5)}
                className={`p-3.5 rounded-xl border font-semibold text-xs sm:text-sm text-center transition-all ${
                  scale === 1.5
                    ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Standard (150 DPI)
              </button>
              <button
                type="button"
                onClick={() => setScale(2.0)}
                className={`p-3.5 rounded-xl border font-semibold text-xs sm:text-sm text-center transition-all ${
                  scale === 2.0
                    ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                High Definition (300 DPI)
              </button>
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
              leftIcon={<Image className="w-5 h-5" />}
              onClick={handleConvert}
              className="w-full text-base py-4"
            >
              Convert PDF to {formatTitle} Images
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
