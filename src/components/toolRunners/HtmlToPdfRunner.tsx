import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { convertHtmlToPdf } from '../../utils/officeConverters';
import { ProcessResult } from '../../types';
import { Code, FileText, AlertCircle, Sparkles } from 'lucide-react';

export const HtmlToPdfRunner: React.FC = () => {
  const [mode, setMode] = useState<'upload' | 'code'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [htmlCode, setHtmlCode] = useState<string>(
    `<!DOCTYPE html>
<html>
<head>
  <title>Document Title</title>
</head>
<body>
  <h1>Executive Summary</h1>
  <p>This document was generated directly from HTML source code using client-side vector rendering.</p>
  
  <h2>Key Highlights</h2>
  <ul>
    <li>High-fidelity vector typography and formatting</li>
    <li>100% Client-Side Privacy: files never leave your device</li>
    <li>Instant downloadable PDF with live preview</li>
  </ul>
</body>
</html>`
  );
  const [outputFileName, setOutputFileName] = useState('webpage_document');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setOutputFileName(f.name.replace(/\.[^/.]+$/, ''));
    try {
      const content = await f.text();
      setHtmlCode(content);
    } catch {
      // ignore
    }
    setErrorMessage(null);
  };

  const handleConvert = async () => {
    if (!htmlCode.trim()) {
      setErrorMessage('Please provide HTML content to convert.');
      return;
    }

    try {
      setStatus('processing');
      setErrorMessage(null);

      const outBytes = await convertHtmlToPdf(htmlCode);
      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const cleanName = outputFileName.trim() || 'webpage_document';
      setResult({
        fileName: `${cleanName.replace(/\.pdf$/i, '')}.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to convert HTML to PDF.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'processing') {
    return (
      <ProcessingState
        message="Converting HTML to PDF..."
        step="Parsing HTML DOM elements, headings, lists, and formatting into clean vector PDF"
      />
    );
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="HTML to PDF" />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Mode Selector */}
      <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
            mode === 'upload'
              ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Upload .html File
        </button>
        <button
          type="button"
          onClick={() => setMode('code')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
            mode === 'code'
              ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Paste HTML Code
        </button>
      </div>

      {mode === 'upload' && !file && (
        <UploadArea
          accept=".html,.htm,text/html"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select an HTML file (.html, .htm)"
          subtitle="Convert web documents and HTML templates into crisp vector PDF pages"
        />
      )}

      {(mode === 'code' || file) && (
        <div className="space-y-6">
          {/* File Card or Editor Banner */}
          {file ? (
            <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 shrink-0">
                  <Code className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                    {file.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Ready to convert to PDF
                  </p>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors shrink-0"
              >
                Change File
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 text-left">
              <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono text-xs">
                HTML Source Code
              </label>
              <textarea
                rows={8}
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                placeholder="Paste your HTML code here..."
                className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {/* Configuration Options */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4 text-xs">
            {/* Output File Name */}
            <div className="space-y-1.5 text-left">
              <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                Output File Name
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus-within:ring-2 focus-within:ring-brand-500 overflow-hidden">
                <input
                  type="text"
                  value={outputFileName}
                  onChange={(e) => setOutputFileName(e.target.value)}
                  placeholder="e.g. web_report"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-transparent outline-none font-semibold"
                />
                <span className="pr-3 pl-2.5 py-2.5 font-mono text-slate-500 dark:text-slate-400 font-bold select-none bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
                  .pdf
                </span>
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
              leftIcon={<Code className="w-5 h-5" />}
              onClick={handleConvert}
              className="w-full text-base py-4"
            >
              Convert HTML to PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
