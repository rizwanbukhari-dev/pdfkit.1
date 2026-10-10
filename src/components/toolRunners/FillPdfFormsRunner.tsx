import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { detectAndFillForm, FormFieldInfo } from '../../utils/documentExporters';
import { ProcessResult } from '../../types';
import { CheckSquare, FileText, Check, AlertCircle, Edit3 } from 'lucide-react';

export const FillPdfFormsRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [outputFileName, setOutputFileName] = useState('filled_form');
  const [fields, setFields] = useState<FormFieldInfo[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
  const [status, setStatus] = useState<'idle' | 'loadingDoc' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setOutputFileName(`${selected.name.replace(/\.pdf$/i, '')}_filled`);
    setStatus('loadingDoc');
    setErrorMessage(null);

    try {
      const { fields: detected } = await detectAndFillForm(selected);
      setFields(detected);

      // Initialize default values
      const initialVals: Record<string, string | boolean> = {};
      detected.forEach((f) => {
        initialVals[f.name] = f.type === 'checkbox' ? f.value === 'true' : f.value;
      });

      // If document doesn't have native AcroForm fields, add quick customizable fields
      if (detected.length === 0) {
        const fallbackFields: FormFieldInfo[] = [
          { name: 'Full Name', type: 'text', value: '' },
          { name: 'Date', type: 'text', value: new Date().toISOString().split('T')[0] },
          { name: 'Email Address', type: 'text', value: '' },
          { name: 'Signature / Approval', type: 'text', value: 'Approved' },
          { name: 'Agree to Terms', type: 'checkbox', value: 'true' },
        ];
        setFields(fallbackFields);
        fallbackFields.forEach((f) => {
          initialVals[f.name] = f.type === 'checkbox' ? true : f.value;
        });
      }

      setFieldValues(initialVals);
      setStatus('idle');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to detect form fields.');
    }
  };

  const handleFieldChange = (name: string, value: string | boolean) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFill = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      const { filledPdfBytes } = await detectAndFillForm(file, fieldValues);
      if (!filledPdfBytes) throw new Error('Could not serialize filled form.');

      const blob = new Blob([filledPdfBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const cleanName = outputFileName.trim() || 'filled_form';
      setResult({
        fileName: `${cleanName.replace(/\.pdf$/i, '')}.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to apply form fields.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setFields([]);
    setFieldValues({});
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (status === 'loadingDoc') {
    return <ProcessingState message="Scanning form fields..." step="Detecting interactive AcroForm inputs" />;
  }

  if (status === 'processing') {
    return <ProcessingState message="Saving filled form..." step="Embedding field data and flattening inputs" />;
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="Filled PDF Form" />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF form to fill"
          subtitle="Fill interactive text fields, checkboxes, and dates with instant PDF generation"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{fields.length} form fields detected</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors shrink-0"
            >
              Change File
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-brand-500" />
              <span>Fill Form Fields</span>
            </h4>

            <div className="space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800">
              {fields.map((f, idx) => (
                <div key={idx} className="pt-3 first:pt-0 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {f.name}
                  </label>

                  {f.type === 'checkbox' ? (
                    <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(fieldValues[f.name])}
                        onChange={(e) => handleFieldChange(f.name, e.target.checked)}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                      />
                      <span>Mark Checked / Yes</span>
                    </label>
                  ) : f.type === 'dropdown' && f.options ? (
                    <select
                      value={String(fieldValues[f.name] || '')}
                      onChange={(e) => handleFieldChange(f.name, e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      {f.options.map((opt, oIdx) => (
                        <option key={oIdx} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={String(fieldValues[f.name] || '')}
                      onChange={(e) => handleFieldChange(f.name, e.target.value)}
                      placeholder={`Enter ${f.name}...`}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                    />
                  )}
                </div>
              ))}
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
              leftIcon={<CheckSquare className="w-5 h-5" />}
              onClick={handleApplyFill}
              className="w-full text-base py-4 font-bold shadow-lg shadow-brand-500/25"
            >
              Export Filled PDF Form
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
