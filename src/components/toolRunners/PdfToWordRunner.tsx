import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { convertPdfToWordDocx } from '../../utils/documentExporters';
import { ProcessResult } from '../../types';
import { FileOutput, FileText, Check, AlertCircle, Sparkles } from 'lucide-react';

export const PdfToWordRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [outputFileName, setOutputFileName] = useState('converted_document');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setOutputFileName(`${f.name.replace(/\.pdf$/i, '')}`);
    setErrorMessage(null);
  };

  const handleConvert = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      const { docxBlob, text } = await convertPdfToWordDocx(file);
      const downloadUrl = URL.createObjectURL(docxBlob);

      const cleanName = outputFileName.trim() || 'word_document';
      setResult({
        fileName: `${cleanName.replace(/\.docx?$/i, '')}.docx`,
        fileSize: docxBlob.size,
        downloadUrl,
        blob: docxBlob,
        textContent: text,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to convert PDF to Word document.');
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
        message="Converting PDF to Word (.docx)..."
        step="Extracting layout, headers, and generating OpenXML document"
      />
    );
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Word (.docx)" />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF to convert to Word (.docx)"
          subtitle="Convert PDF files into fully editable Microsoft Word (.docx) documents with typography preserved"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                <FileOutput className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Ready for Microsoft Word export</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors shrink-0"
            >
              Change File
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider font-mono">
              <Sparkles className="w-4 h-4" />
              <span>Word Export Features</span>
            </div>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Generates true OpenXML (.docx) format compatible with Microsoft Word & Google Docs</li>
              <li>Reconstructs paragraphs, heading hierarchy, and bullet points</li>
              <li>100% private in-browser conversion without sending data to external servers</li>
            </ul>

            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono mb-1.5">
                Output File Name
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus-within:ring-2 focus-within:ring-brand-500 overflow-hidden shadow-xs">
                <input
                  type="text"
                  value={outputFileName}
                  onChange={(e) => setOutputFileName(e.target.value)}
                  placeholder="e.g. document"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-transparent outline-none font-semibold"
                />
                <span className="pr-3 pl-2.5 py-2.5 text-xs font-mono text-slate-500 dark:text-slate-400 font-bold select-none bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
                  .docx
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

          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<FileOutput className="w-5 h-5" />}
              onClick={handleConvert}
              className="w-full text-base py-4 font-bold shadow-lg shadow-brand-500/25"
            >
              Convert to Word (.docx)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
