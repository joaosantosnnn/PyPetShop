import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches;

export const PwaInstallPrompt: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('petgestor-install-dismissed') === 'true');

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const clearPrompt = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', clearPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', clearPrompt);
    };
  }, []);

  if (!installPrompt || dismissed || isInstalled()) return null;

  const install = async () => {
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  };

  const dismiss = () => {
    sessionStorage.setItem('petgestor-install-dismissed', 'true');
    setDismissed(true);
  };

  return (
    <aside className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-teal-200 bg-white p-4 shadow-2xl dark:border-teal-900 dark:bg-slate-900 md:bottom-6 md:left-auto md:right-6 md:translate-x-0">
      <button onClick={dismiss} className="absolute right-3 top-3 text-slate-400 hover:text-slate-700" aria-label="Fechar aviso de instalação"><X className="h-4 w-4" /></button>
      <div className="flex items-start gap-3 pr-6">
        <div className="rounded-xl bg-teal-100 p-2.5 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><Download className="h-5 w-5" /></div>
        <div>
          <h2 className="text-sm font-bold">Instalar PetGestor</h2>
          <p className="mt-1 text-xs text-slate-500">Use o sistema em uma janela própria e acesse pelo menu Iniciar.</p>
          <button onClick={install} className="mt-3 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700">Instalar no computador</button>
        </div>
      </div>
    </aside>
  );
};