import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type InstallationStatus = 'uninstalled' | 'installing' | 'installed';

export interface PWAInstallContextType {
  isInstallable: boolean;
  canInstall: boolean; // Alias for isInstallable
  isInstalled: boolean;
  isStandalone: boolean;
  installationStatus: InstallationStatus;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isModalOpen: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unsupported'>;
  openInstallModal: () => void;
  closeInstallModal: () => void;
}

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(undefined);

export const PWAInstallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && (window as any).__PDFKIT_INSTALL_EVENT__) {
      return (window as any).__PDFKIT_INSTALL_EVENT__ as BeforeInstallPromptEvent;
    }
    return null;
  });

  const [isIOS] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent || '';
    return (
      /iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    );
  });

  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://')
    );
  });

  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://')
    );
  });

  const [installationStatus, setInstallationStatus] = useState<InstallationStatus>(() => {
    if (typeof window === 'undefined') return 'uninstalled';
    return window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')
      ? 'installed'
      : 'uninstalled';
  });

  const [isInstallable, setIsInstallable] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && (window as any).__PDFKIT_INSTALL_EVENT__) {
      return true;
    }
    return false;
  });

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(deferredPrompt);

  useEffect(() => {
    deferredPromptRef.current = deferredPrompt;
  }, [deferredPrompt]);

  const isAndroid = typeof window !== 'undefined' && /android/i.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid || (typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen to display-mode media query changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      if (e.matches) {
        setIsInstalled(true);
        setInstallationStatus('installed');
        setIsInstallable(false);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    // Capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      (window as any).__PDFKIT_INSTALL_EVENT__ = installEvent;
      setDeferredPrompt(installEvent);
      deferredPromptRef.current = installEvent;
      setIsInstallable(true);
      setInstallationStatus('uninstalled');
      console.log('[PDFKit PWA] Captured beforeinstallprompt event.');
    };

    // App installed event
    const handleAppInstalled = () => {
      console.log('[PDFKit PWA] App installed successfully.');
      setDeferredPrompt(null);
      deferredPromptRef.current = null;
      (window as any).__PDFKIT_INSTALL_EVENT__ = null;
      setIsInstallable(false);
      setIsInstalled(true);
      setInstallationStatus('installed');
      setIsModalOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Also listen for early capture custom event from index.html
    const handleEarlyReady = () => {
      if ((window as any).__PDFKIT_INSTALL_EVENT__) {
        handleBeforeInstallPrompt((window as any).__PDFKIT_INSTALL_EVENT__);
      }
    };
    window.addEventListener('pdfkit-install-ready', handleEarlyReady);

    // Check if early capture already happened
    if ((window as any).__PDFKIT_INSTALL_EVENT__) {
      handleBeforeInstallPrompt((window as any).__PDFKIT_INSTALL_EVENT__);
    }

    // Register Service Worker immediately on mount (RizKey proven pattern)
    if (
      'serviceWorker' in navigator &&
      (window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1')
    ) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const installing = registration.installing;
            if (installing) {
              installing.addEventListener('statechange', () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PDFKit PWA] New update available.');
                }
              });
            }
          });
        })
        .catch((err) => {
          console.debug('[PDFKit PWA] Service worker registration note:', err);
        });
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pdfkit-install-ready', handleEarlyReady);
    };
  }, []);

  // Real installation trigger matching RizKey's working behavior
  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unsupported'> => {
    const promptEvent = deferredPromptRef.current || (window as any).__PDFKIT_INSTALL_EVENT__;

    if (promptEvent) {
      try {
        setInstallationStatus('installing');
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        console.log('[PDFKit PWA] User install choice outcome:', choice.outcome);

        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          deferredPromptRef.current = null;
          (window as any).__PDFKIT_INSTALL_EVENT__ = null;
          setIsInstallable(false);
          return 'accepted';
        } else {
          setInstallationStatus('uninstalled');
          return 'dismissed';
        }
      } catch (err) {
        console.error('[PDFKit PWA] Installation prompt error:', err);
        setInstallationStatus('uninstalled');
        setIsModalOpen(true);
        return 'unsupported';
      }
    } else {
      // Prompt not directly available (e.g. iOS Safari, Firefox, or already installed/prompted)
      setIsModalOpen(true);
      return 'unsupported';
    }
  }, []);

  const openInstallModal = useCallback(() => setIsModalOpen(true), []);
  const closeInstallModal = useCallback(() => setIsModalOpen(false), []);

  return (
    <PWAInstallContext.Provider
      value={{
        isInstallable,
        canInstall: isInstallable,
        isInstalled,
        isStandalone,
        installationStatus,
        isIOS,
        isAndroid,
        isMobile,
        isModalOpen,
        promptInstall,
        openInstallModal,
        closeInstallModal,
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
};

export const usePWAInstall = (): PWAInstallContextType => {
  const context = useContext(PWAInstallContext);
  if (!context) {
    throw new Error('usePWAInstall must be used within a PWAInstallProvider');
  }
  return context;
};
