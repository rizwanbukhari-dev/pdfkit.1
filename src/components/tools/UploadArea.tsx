import React, { useRef, useState, DragEvent } from 'react';
import { UploadCloud, File, AlertCircle, Plus, CheckCircle2 } from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

interface UploadAreaProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFilesSelected: (files: File[]) => void;
  title?: string;
  subtitle?: string;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  accept = '.pdf,application/pdf',
  multiple = false,
  maxSizeMB = 100,
  onFilesSelected,
  title = 'Select or drop your file here',
  subtitle = 'Supports PDF files up to 100MB',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndPassFiles = (fileList: FileList | null) => {
    setErrorMessage(null);
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);

    // Validate count
    if (!multiple && filesArray.length > 1) {
      setErrorMessage('Please select only one file for this tool.');
      return;
    }

    // Validate size
    for (const f of filesArray) {
      if (f.size > maxSizeMB * 1024 * 1024) {
        setErrorMessage(`File "${f.name}" is too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }
    }

    // Validate type
    const acceptedExtensions = accept
      .split(',')
      .map((s) => s.trim().toLowerCase());

    const isValid = filesArray.every((f) => {
      const fileNameLower = f.name.toLowerCase();
      const fileTypeLower = f.type.toLowerCase();
      return acceptedExtensions.some((ext) => {
        if (ext.startsWith('.')) {
          return fileNameLower.endsWith(ext);
        }
        return fileTypeLower === ext || fileTypeLower.includes(ext.replace('/*', ''));
      });
    });

    if (!isValid) {
      setErrorMessage('Invalid file type. Please upload the requested file format.');
      return;
    }

    onFilesSelected(filesArray);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    validateAndPassFiles(e.dataTransfer.files);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 group select-none ${
          isDragging
            ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-brand-500 dark:hover:border-brand-400 hover:bg-slate-50/80 dark:hover:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            validateAndPassFiles(e.target.files);
            // Reset input so re-selecting same file triggers onChange
            e.target.value = '';
          }}
        />

        {/* Upload Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-brand-50 dark:bg-brand-950/60 border border-brand-100 dark:border-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-md group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white transition-all duration-300 mb-5">
          <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        {/* Text */}
        <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {subtitle}
        </p>

        {/* Primary Action Button */}
        <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 text-white font-semibold text-sm shadow-md shadow-brand-500/20 group-hover:bg-brand-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>{multiple ? 'Choose Files' : 'Choose File'}</span>
        </div>

        <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          or drag and drop your document here
        </p>
      </div>

      {/* Friendly Error Message */}
      {errorMessage && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in duration-150">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
