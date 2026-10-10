import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  LockKeyhole,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  FileText,
  Sliders,
  Download,
  Combine,
  Scissors,
  Minimize2,
  Image,
  PenTool,
} from 'lucide-react';
import { ALL_TOOLS, CATEGORIES } from '../../data/toolsData';
import { ToolDefinition, ToolCategory } from '../../types';
import { ToolCard } from '../tools/ToolCard';
import { Button } from '../common/Button';

interface HomePageProps {
  onSelectTool: (tool: ToolDefinition) => void;
  onExploreAllTools: () => void;
  onOpenSearch: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectTool,
  onExploreAllTools,
  onOpenSearch,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = ALL_TOOLS.filter((t) => {
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-8 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto hero-glow">
        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Everything You Need to <span className="gradient-text">Work With PDFs</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 sm:mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Merge, split, compress, convert, edit and manage your PDFs with simple and powerful tools.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Button
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={onExploreAllTools}
            className="w-full sm:w-auto text-base px-8 py-4 shadow-lg shadow-brand-500/25"
          >
            Explore All Tools
          </Button>

          <a
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 px-6 py-3.5 text-base transition-all"
          >
            How It Works
          </a>
        </div>

        {/* Trust Highlights Grid */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm flex items-center gap-3 shadow-soft">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Free to Use</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">100% Free forever</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm flex items-center gap-3 shadow-soft">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
              <LockKeyhole className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">No Signup Required</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Works immediately</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm flex items-center gap-3 shadow-soft">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Fast Processing</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Local browser engine</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm flex items-center gap-3 shadow-soft">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Privacy Focused</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Never leaves your device</p>
            </div>
          </div>
        </div>

        {/* Quick Inline Search Bar */}
        <div className="mt-10 max-w-xl mx-auto">
          <div
            onClick={onOpenSearch}
            className="flex items-center px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-soft hover:shadow-soft-lg hover:border-brand-500 cursor-pointer transition-all gap-3"
          >
            <Search className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-400 flex-1 text-left">
              Search any tool (e.g. merge, compress, sign, jpg)...
            </span>
            <kbd className="px-2 py-0.5 text-xs font-mono bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-400">
              ⌘K
            </kbd>
          </div>
        </div>
      </section>



      {/* Tool Catalog Section with Category Filter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Complete PDF Tool Catalog
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Browse through all our categories to organize, convert, edit, and secure your files.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 justify-start sm:justify-center no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition-all ${
              selectedCategory === 'all'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            All Categories ({ALL_TOOLS.length})
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition-all ${
                selectedCategory === cat.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-8">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onClick={onSelectTool} />
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="rounded-3xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-8 sm:p-14 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-mono mb-2">
            <span>Simple 4-Step Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How PDFKit Works
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            No software installation. No account needed. Ready in seconds.
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">Choose a Tool</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Select from our suite of 35 document tools tailored for students and professionals.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">Upload Files</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Drag and drop your PDF or images into our secure client-side upload dropzone.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">Instant Process</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                High-performance WebAssembly and vector engines process your files right in your browser.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm">
                04
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">Download Result</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Save your final PDF or ZIP archive instantly with zero waiting queues or watermarks.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
