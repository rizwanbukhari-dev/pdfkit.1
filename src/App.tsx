import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { FloatingWatermark } from './components/common/FloatingWatermark';
import { ToolSearchModal } from './components/tools/ToolSearchModal';
import { ComingSoonModal } from './components/tools/ComingSoonModal';
import { InstallModal } from './components/common/InstallModal';
import { usePWAInstall } from './context/PWAInstallContext';

import { HomePage } from './components/views/HomePage';
import { AllToolsPage } from './components/views/AllToolsPage';
import { ToolDetailPage } from './components/views/ToolDetailPage';
import { AboutPage } from './components/views/AboutPage';
import { ContactPage } from './components/views/ContactPage';

import { ALL_TOOLS } from './data/toolsData';
import { ToolDefinition } from './types';

export function App() {
  const [currentView, setCurrentView] = useState<'home' | 'all-tools' | 'tool-detail' | 'about' | 'contact'>('home');
  const [activeTool, setActiveTool] = useState<ToolDefinition | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [comingSoonTool, setComingSoonTool] = useState<ToolDefinition | null>(null);

  const { isModalOpen, closeInstallModal } = usePWAInstall();

  // Parse path on initial load and handle browser back/forward buttons
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.replace(/^\/|\/$/g, '');
      if (!path || path === '') {
        setCurrentView('home');
        setActiveTool(null);
      } else if (path === 'tools') {
        setCurrentView('all-tools');
        setActiveTool(null);
      } else if (path.startsWith('tools/')) {
        const toolId = path.replace('tools/', '');
        const matched = ALL_TOOLS.find((t) => t.id === toolId);
        if (matched) {
          if (matched.isWorking) {
            setActiveTool(matched);
            setCurrentView('tool-detail');
          } else {
            setCurrentView('all-tools');
            setComingSoonTool(matched);
          }
        } else {
          setCurrentView('all-tools');
        }
      } else if (path === 'about') {
        setCurrentView('about');
        setActiveTool(null);
      } else if (path === 'contact') {
        setCurrentView('contact');
        setActiveTool(null);
      } else {
        setCurrentView('home');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (view: string, toolId?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (view === 'tool-detail' && toolId) {
      const tool = ALL_TOOLS.find((t) => t.id === toolId);
      if (tool) {
        handleToolSelect(tool);
        return;
      }
    }

    if (view === 'home') {
      window.history.pushState(null, '', '/');
      setCurrentView('home');
      setActiveTool(null);
      document.title = 'PDFKit — Everything You Need to Work With PDFs';
    } else if (view === 'all-tools') {
      window.history.pushState(null, '', '/tools');
      setCurrentView('all-tools');
      setActiveTool(null);
      document.title = 'All PDF Tools — PDFKit';
    } else if (view === 'about') {
      window.history.pushState(null, '', '/about');
      setCurrentView('about');
      setActiveTool(null);
      document.title = 'About PDFKit — Free & Secure PDF Tools';
    } else if (view === 'contact') {
      window.history.pushState(null, '', '/contact');
      setCurrentView('contact');
      setActiveTool(null);
      document.title = 'Contact & Developer — PDFKit';
    }
  };

  const handleToolSelect = (tool: ToolDefinition) => {
    if (!tool.isWorking) {
      setComingSoonTool(tool);
      return;
    }

    setActiveTool(tool);
    setCurrentView('tool-detail');
    window.history.pushState(null, '', `/tools/${tool.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Navigation Header */}
      <Header
        currentView={currentView}
        onNavigate={navigateTo}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            onSelectTool={handleToolSelect}
            onExploreAllTools={() => navigateTo('all-tools')}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        )}

        {currentView === 'all-tools' && (
          <AllToolsPage onSelectTool={handleToolSelect} />
        )}

        {currentView === 'tool-detail' && activeTool && (
          <ToolDetailPage
            tool={activeTool}
            onBack={() => navigateTo('all-tools')}
            onNavigateHome={() => navigateTo('home')}
            onExploreOtherTools={() => navigateTo('all-tools')}
          />
        )}

        {currentView === 'about' && (
          <AboutPage onExploreTools={() => navigateTo('all-tools')} />
        )}

        {currentView === 'contact' && <ContactPage />}
      </main>

      {/* Global Footer with Verified Developer Attribution */}
      <Footer onNavigate={navigateTo} />

      {/* Global Tool Search Modal */}
      <ToolSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTool={handleToolSelect}
      />

      {/* Coming Soon Modal */}
      <ComingSoonModal
        tool={comingSoonTool}
        isOpen={comingSoonTool !== null}
        onClose={() => setComingSoonTool(null)}
        onExploreWorkingTools={() => {
          setComingSoonTool(null);
          navigateTo('all-tools');
        }}
      />

      {/* Install App Guide Modal */}
      <InstallModal isOpen={isModalOpen} onClose={closeInstallModal} />

      {/* Floating Stylish Watermark & Separated Social Badges */}
      <FloatingWatermark />
    </div>
  );
}

export default App;
