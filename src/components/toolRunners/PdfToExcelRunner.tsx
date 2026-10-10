import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { convertPdfToExcel } from '../../utils/documentExporters';
import { ProcessResult } from '../../types';
import { Table, FileSpreadsheet, Check, AlertCircle, Sparkles } from 'lucide-react';

export const PdfToExcelRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [outputFileName, setOutputFileName] = useState('extracted_table');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setOutputFileName(`${f.name.replace(/\.pdf$/i, '')}_sheets`);
    setErrorMessage(null);
  };

  const handleConvert = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      const { xlsxBlob, csvText, rows } = await convertPdfToExcel(file);
      const downloadUrl = URL.createObjectURL(xlsxBlob);

      const cleanName = outputFileName.trim() || 'excel_table';
      setResult({
        fileName: `${cleanName.replace(/\.xlsx?$/i, '')}.xlsx`,
        fileSize: xlsxBlob.size,
        downloadUrl,
        blob: xlsxBlob,
        textContent: csvText,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to extract tabular data into Excel.');
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
        message="Extracting PDF tables to Excel (.xlsx)..."
        step="Detecting table grids, row-column boundaries, and shared strings"
      />
    );
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Excel Spreadsheet" />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF to extract tables to Excel"
          subtitle="Extract PDF tables straight into editable Microsoft Excel spreadsheets (.xlsx)"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Table className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Ready for Excel tabular extraction</p>
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
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono">
              <Sparkles className="w-4 h-4" />
              <span>Smart Table Boundary Detection</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Algorithms detect rows and columns from coordinate alignments and export standard .xlsx files with shared string tables.
            </p>

            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono mb-1.5">
                Output File Name
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus-within:ring-2 focus-within:ring-brand-500 overflow-hidden shadow-xs">
                <input
                  type="text"
                  value={outputFileName}
                  onChange={(e) => setOutputFileName(e.target.value)}
                  placeholder="e.g. extracted_table"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-transparent outline-none font-semibold"
                />
                <span className="pr-3 pl-2.5 py-2.5 text-xs font-mono text-slate-500 dark:text-slate-400 font-bold select-none bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
                  .xlsx
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
              leftIcon={<Table className="w-5 h-5" />}
              onClick={handleConvert}
              className="w-full text-base py-4 font-bold shadow-lg shadow-brand-500/25"
            >
              Extract Tables to Excel (.xlsx)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
