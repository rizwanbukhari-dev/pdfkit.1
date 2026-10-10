import React, { useEffect } from 'react';
import { ToolDefinition } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { Badge } from '../common/Badge';
import { ShieldCheck, ChevronRight, ArrowLeft } from 'lucide-react';

// Runners
import { MergePdfRunner } from '../toolRunners/MergePdfRunner';
import { SplitPdfRunner } from '../toolRunners/SplitPdfRunner';
import { RemovePagesRunner } from '../toolRunners/RemovePagesRunner';
import { ExtractPagesRunner } from '../toolRunners/ExtractPagesRunner';
import { OrganizePdfRunner } from '../toolRunners/OrganizePdfRunner';
import { RotatePdfRunner } from '../toolRunners/RotatePdfRunner';
import { CompressPdfRunner } from '../toolRunners/CompressPdfRunner';
import { ImagesToPdfRunner } from '../toolRunners/ImagesToPdfRunner';
import { PdfToImagesRunner } from '../toolRunners/PdfToImagesRunner';
import { PdfToTextRunner } from '../toolRunners/PdfToTextRunner';
import { PdfToMarkdownRunner } from '../toolRunners/PdfToMarkdownRunner';
import { AddPageNumbersRunner } from '../toolRunners/AddPageNumbersRunner';
import { AddWatermarkRunner } from '../toolRunners/AddWatermarkRunner';
import { SignPdfRunner } from '../toolRunners/SignPdfRunner';
import { RedactPdfRunner } from '../toolRunners/RedactPdfRunner';
import { RepairPdfRunner } from '../toolRunners/RepairPdfRunner';
import { CropPdfRunner } from '../toolRunners/CropPdfRunner';
import { WordToPdfRunner } from '../toolRunners/WordToPdfRunner';
import { ExcelToPdfRunner } from '../toolRunners/ExcelToPdfRunner';
import { PowerpointToPdfRunner } from '../toolRunners/PowerpointToPdfRunner';
import { HtmlToPdfRunner } from '../toolRunners/HtmlToPdfRunner';
import { OcrPdfRunner } from '../toolRunners/OcrPdfRunner';
import { PdfToWordRunner } from '../toolRunners/PdfToWordRunner';
import { PdfToPowerpointRunner } from '../toolRunners/PdfToPowerpointRunner';
import { PdfToExcelRunner } from '../toolRunners/PdfToExcelRunner';
import { EditPdfRunner } from '../toolRunners/EditPdfRunner';
import { FillPdfFormsRunner } from '../toolRunners/FillPdfFormsRunner';
import { AnnotatePdfRunner } from '../toolRunners/AnnotatePdfRunner';
import { ProtectPdfRunner } from '../toolRunners/ProtectPdfRunner';
import { UnlockPdfRunner } from '../toolRunners/UnlockPdfRunner';
import { ComparePdfRunner } from '../toolRunners/ComparePdfRunner';
import { AiPdfSummarizerRunner } from '../toolRunners/AiPdfSummarizerRunner';
import { TranslatePdfRunner } from '../toolRunners/TranslatePdfRunner';
import { Button } from '../common/Button';

interface ToolDetailPageProps {
  tool: ToolDefinition;
  onBack: () => void;
  onNavigateHome: () => void;
  onExploreOtherTools: () => void;
}

export const ToolDetailPage: React.FC<ToolDetailPageProps> = ({
  tool,
  onBack,
  onNavigateHome,
  onExploreOtherTools,
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = `${tool.name} — PDFKit`;
    return () => {
      document.title = 'PDFKit — Everything You Need to Work With PDFs';
    };
  }, [tool]);

  const renderToolRunner = () => {
    switch (tool.id) {
      case 'merge-pdf':
        return <MergePdfRunner />;
      case 'split-pdf':
        return <SplitPdfRunner />;
      case 'remove-pages':
        return <RemovePagesRunner />;
      case 'extract-pages':
        return <ExtractPagesRunner />;
      case 'organize-pdf':
        return <OrganizePdfRunner />;
      case 'rotate-pdf':
        return <RotatePdfRunner />;
      case 'compress-pdf':
        return <CompressPdfRunner />;
      case 'jpg-to-pdf':
        return <ImagesToPdfRunner imageFormat="jpg" />;
      case 'png-to-pdf':
        return <ImagesToPdfRunner imageFormat="png" />;
      case 'pdf-to-jpg':
        return <PdfToImagesRunner format="jpg" />;
      case 'pdf-to-png':
        return <PdfToImagesRunner format="png" />;
      case 'pdf-to-text':
        return <PdfToTextRunner />;
      case 'pdf-to-markdown':
        return <PdfToMarkdownRunner />;
      case 'add-page-numbers':
        return <AddPageNumbersRunner />;
      case 'add-watermark':
        return <AddWatermarkRunner />;
      case 'sign-pdf':
        return <SignPdfRunner />;
      case 'redact-pdf':
        return <RedactPdfRunner />;
      case 'repair-pdf':
        return <RepairPdfRunner />;
      case 'crop-pdf':
        return <CropPdfRunner />;
      case 'word-to-pdf':
        return <WordToPdfRunner />;
      case 'excel-to-pdf':
        return <ExcelToPdfRunner />;
      case 'powerpoint-to-pdf':
        return <PowerpointToPdfRunner />;
      case 'html-to-pdf':
        return <HtmlToPdfRunner />;
      case 'ocr-pdf':
        return <OcrPdfRunner />;
      case 'pdf-to-word':
        return <PdfToWordRunner />;
      case 'pdf-to-powerpoint':
        return <PdfToPowerpointRunner />;
      case 'pdf-to-excel':
        return <PdfToExcelRunner />;
      case 'edit-pdf':
        return <EditPdfRunner />;
      case 'fill-pdf-forms':
        return <FillPdfFormsRunner />;
      case 'annotate-pdf':
        return <AnnotatePdfRunner />;
      case 'protect-pdf':
        return <ProtectPdfRunner />;
      case 'unlock-pdf':
        return <UnlockPdfRunner />;
      case 'compare-pdf':
        return <ComparePdfRunner />;
      case 'ai-pdf-summarizer':
        return <AiPdfSummarizerRunner />;
      case 'translate-pdf':
        return <TranslatePdfRunner />;
      default:
        return (
          <div className="max-w-xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <DynamicIcon name={tool.iconName} className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-2">
                {tool.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {tool.description}
              </p>
            </div>
            <div className="pt-2">
              <Button variant="primary" onClick={onExploreOtherTools}>
                Explore Other Tools
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-8 select-none">
        <button
          onClick={onNavigateHome}
          className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button
          onClick={onBack}
          className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors capitalize"
        >
          Tools
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 dark:text-white font-semibold">{tool.name}</span>
      </nav>

      {/* Tool Header Banner */}
      <div className="mb-10 text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-100 dark:border-brand-900/60 text-brand-700 dark:text-brand-300 text-xs font-semibold">
          <DynamicIcon name={tool.iconName} className="w-4 h-4" />
          <span className="capitalize">{tool.category.replace('-', ' ')} Tool</span>
          <span className="opacity-60">•</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wide text-[10px]">
            100% Free
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {tool.name}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          {tool.description}
        </p>

        <div className="pt-2 inline-flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Private & Secure • Processed directly inside your browser</span>
        </div>
      </div>

      {/* Runner Workspace */}
      <div className="mt-8">{renderToolRunner()}</div>
    </div>
  );
};
