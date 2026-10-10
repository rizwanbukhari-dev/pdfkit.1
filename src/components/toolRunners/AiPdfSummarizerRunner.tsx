import React, { useState } from 'react';
import { UploadArea } from '../tools/UploadArea';
import { ProcessingState } from '../tools/ProcessingState';
import { ResultCard } from '../tools/ResultCard';
import { Button } from '../common/Button';
import { summarizePdf, DocumentSummary } from '../../utils/documentExporters';
import { ProcessResult } from '../../types';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Sparkles, FileText, Check, AlertCircle, Clock, KeyRound } from 'lucide-react';

export const AiPdfSummarizerRunner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setErrorMessage(null);
  };

  const handleSummarize = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage(null);

      const summary: DocumentSummary = await summarizePdf(file);

      const formattedSummaryText = [
        `# Summary: ${file.name}`,
        `Word Count: ${summary.wordCount.toLocaleString()} words | Estimated Reading Time: ~${summary.readingTimeMinutes} min`,
        `\n## Executive Summary`,
        summary.executiveSummary,
        `\n## Key Takeaways`,
        ...summary.keyTakeaways.map((k) => `• ${k}`),
        `\n## Core Keywords & Topics`,
        summary.topKeywords.join(', '),
      ].join('\n\n');

      // Generate a PDF report
      const pdfDoc = await PDFDocument.create();
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const page = pdfDoc.addPage([595.28, 841.89]);
      let y = 841.89 - 50;

      page.drawText('Document Executive Summary & Takeaways', {
        x: 50,
        y,
        size: 16,
        font: fontBold,
        color: rgb(0.1, 0.15, 0.35),
      });
      y -= 25;

      page.drawText(`Document: ${file.name} | ~${summary.readingTimeMinutes} min read`, {
        x: 50,
        y,
        size: 9.5,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 25;

      page.drawText('EXECUTIVE SUMMARY', {
        x: 50,
        y,
        size: 11,
        font: fontBold,
        color: rgb(0.2, 0.3, 0.5),
      });
      y -= 18;

      // Draw wrapped executive summary
      const execWords = summary.executiveSummary.split(' ');
      let line = '';
      for (const w of execWords) {
        if ((line + ' ' + w).length > 75) {
          page.drawText(line, { x: 50, y, size: 9.5, font, color: rgb(0.15, 0.15, 0.15) });
          y -= 14;
          line = w;
        } else {
          line += (line ? ' ' : '') + w;
        }
      }
      if (line) {
        page.drawText(line, { x: 50, y, size: 9.5, font, color: rgb(0.15, 0.15, 0.15) });
        y -= 24;
      }

      page.drawText('KEY TAKEAWAYS', {
        x: 50,
        y,
        size: 11,
        font: fontBold,
        color: rgb(0.2, 0.3, 0.5),
      });
      y -= 18;

      for (const t of summary.keyTakeaways) {
        page.drawText(`• ${t.slice(0, 80)}`, {
          x: 50,
          y,
          size: 9.5,
          font,
          color: rgb(0.15, 0.15, 0.15),
        });
        y -= 16;
      }

      const outBytes = await pdfDoc.save();
      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        fileName: `${file.name.replace(/\.pdf$/i, '')}_summary.pdf`,
        fileSize: blob.size,
        downloadUrl,
        blob,
        textContent: formattedSummaryText,
      });

      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to analyze and summarize document.');
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
        message="Analyzing document with NLP..."
        step="Extracting key topics, calculating centrality scores, and building executive takeaways"
      />
    );
  }

  if (status === 'success' && result) {
    return <ResultCard result={result} onReset={handleReset} toolName="AI Summary" />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {!file ? (
        <UploadArea
          accept=".pdf,application/pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Select a PDF to summarize"
          subtitle="Extract key insights, executive summary, and bulleted takeaways instantly with client-side NLP"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Ready for NLP document intelligence</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors shrink-0"
            >
              Change File
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-2.5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Smart Client-Side Intelligence</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your document is processed 100% locally on your computer with zero external API calls or server transmission, ensuring complete privacy for confidential records and financial reports.
            </p>
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
              leftIcon={<Sparkles className="w-5 h-5" />}
              onClick={handleSummarize}
              className="w-full text-base py-4 font-bold shadow-lg shadow-purple-500/25 bg-purple-600 hover:bg-purple-700"
            >
              Generate AI Summary & Key Takeaways
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
