import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  RotateCcw,
  FileText,
  Archive,
  Copy,
  Check,
  TrendingDown,
  Eye,
  Edit3,
  ExternalLink,
} from 'lucide-react';
import { ProcessResult } from '../../types';
import { formatBytes, downloadBlob } from '../../utils/formatters';
import { Button } from '../common/Button';
import { PdfViewerModal } from './PdfViewerModal';

interface ResultCardProps {
  result: ProcessResult;
  onReset: () => void;
  toolName?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onReset, toolName = 'File' }) => {
  const [copied, setCopied] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Extract base filename and extension
  const initialBase = result.fileName.includes('.')
    ? result.fileName.slice(0, result.fileName.lastIndexOf('.'))
    : result.fileName;
  const extension = result.fileName.includes('.')
    ? result.fileName.slice(result.fileName.lastIndexOf('.'))
    : '.pdf';

  const [baseName, setBaseName] = useState(initialBase);

  // Compute active final file name
  const finalFileName = `${(baseName.trim() || 'document')}${extension}`;
  const isPdf = extension.toLowerCase() === '.pdf' || result.blob.type === 'application/pdf';

  const handleDownloadMain = () => {
    downloadBlob(result.blob, finalFileName);
  };

  const handleCopyText = () => {
    if (result.textContent) {
      navigator.clipboard.writeText(result.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft-lg p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95 duration-200">
      {/* Success Icon */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-md">
        <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>

      <div className="space-y-1">
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
          Your file is ready!
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          The operation completed successfully. You can preview, rename, and download your document below.
        </p>
      </div>

      {/* Editable File Name Input Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-brand-500" />
            <span>Output File Name</span>
          </label>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {formatBytes(result.fileSize)}
          </span>
        </div>

        {/* Input Field with Locked Extension */}
        <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 overflow-hidden shadow-xs transition-all">
          <div className="pl-3 text-slate-400 shrink-0">
            <FileText className="w-4 h-4 text-brand-500" />
          </div>
          <input
            type="text"
            value={baseName}
            onChange={(e) => setBaseName(e.target.value)}
            placeholder="Enter file name"
            className="w-full px-3 py-2.5 text-sm text-slate-900 dark:text-white bg-transparent outline-none font-semibold truncate"
          />
          <span className="pr-3 pl-2.5 py-2.5 text-xs font-mono text-slate-500 dark:text-slate-400 font-bold select-none bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shrink-0">
            {extension}
          </span>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Type above to rename this file before downloading or previewing.
        </p>

        {/* Compression Statistics (if present) */}
        {result.originalSize !== undefined && result.compressedSize !== undefined && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400 block">Original Size:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatBytes(result.originalSize)}
              </span>
            </div>

            <div className="space-y-0.5 text-right">
              <span className="text-slate-400 block">Compressed Size:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatBytes(result.compressedSize)}
              </span>
            </div>

            {result.savingsPercent !== undefined && (
              <div className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>
                  {result.savingsPercent > 0 ? `-${result.savingsPercent}%` : 'Already Optimized'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Text preview box if text content */}
      {result.textContent && (
        <div className="text-left space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider font-mono">Content Preview</span>
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {result.textContent}
          </div>
        </div>
      )}

      {/* Secondary individual downloads (e.g. for converted images) */}
      {result.secondaryDownloads && result.secondaryDownloads.length > 0 && (
        <div className="text-left space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono block">
            Individual Pages ({result.secondaryDownloads.length})
          </span>
          <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl">
            {result.secondaryDownloads.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {item.name}
                </span>
                <button
                  onClick={() => downloadBlob(item.blob, item.name)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Action Buttons: View PDF & Download */}
      <div className="space-y-3 pt-2">
        {isPdf ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. View PDF Button */}
            <Button
              variant="outline"
              size="lg"
              leftIcon={<Eye className="w-5 h-5 text-brand-500" />}
              onClick={() => setIsViewerOpen(true)}
              className="w-full text-base py-4 font-bold border-2 border-brand-500/30 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 text-brand-700 dark:text-brand-300"
            >
              View PDF
            </Button>

            {/* 2. Download Document Button */}
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Download className="w-5 h-5" />}
              onClick={handleDownloadMain}
              className="w-full text-base py-4 font-bold shadow-lg shadow-brand-500/25"
            >
              Download PDF
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            size="lg"
            leftIcon={result.fileName.endsWith('.zip') ? <Archive className="w-5 h-5" /> : <Download className="w-5 h-5" />}
            onClick={handleDownloadMain}
            className="w-full text-base py-4 font-bold shadow-lg shadow-brand-500/25"
          >
            {result.fileName.endsWith('.zip') ? 'Download All as ZIP Archive' : 'Download Document'}
          </Button>
        )}

        {/* Process Another File Button */}
        <Button
          variant="outline"
          size="md"
          leftIcon={<RotateCcw className="w-4 h-4" />}
          onClick={onReset}
          className="w-full"
        >
          Process Another File
        </Button>
      </div>

      {/* Embedded PDF Viewer Modal */}
      {isPdf && (
        <PdfViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          pdfUrl={result.downloadUrl}
          blob={result.blob}
          fileName={finalFileName}
          fileSize={result.fileSize}
        />
      )}
    </div>
  );
};
