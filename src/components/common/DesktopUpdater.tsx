import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, RotateCcw, X } from 'lucide-react';

export type DesktopUpdateStatus = {
  state: 'idle' | 'development' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'current' | 'error';
  version?: string;
  percent?: number;
  message?: string;
};

declare global {
  interface Window {
    petGestorDesktop?: {
      onAuthCallback: (callback: (url: string) => void) => () => void;
      getUpdateStatus: () => Promise<DesktopUpdateStatus>;
      checkForUpdates: () => Promise<DesktopUpdateStatus>;
      installUpdate: () => Promise<void>;
      onUpdateStatus: (callback: (status: DesktopUpdateStatus) => void) => () => void;
    };
  }
}

export const DesktopUpdater: React.FC = () => {
  const desktop = window.petGestorDesktop;
  const [status, setStatus] = useState<DesktopUpdateStatus>({ state: 'idle' });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!desktop) return;
    void desktop.getUpdateStatus().then(setStatus);
    return desktop.onUpdateStatus(nextStatus => {
      setStatus(nextStatus);
      if (['available', 'downloading', 'downloaded', 'error'].includes(nextStatus.state)) setDismissed(false);
    });
  }, [desktop]);

  if (!desktop || dismissed || !['available', 'downloading', 'downloaded', 'error'].includes(status.state)) return null;

  return (
    <aside className="fixed bottom-5 right-5 z-[100] w-[min(92vw,390px)] rounded-2xl border border-teal-200 bg-white p-4 shadow-2xl dark:border-teal-900 dark:bg-slate-900" role="status">
      <button onClick={() => setDismissed(true)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-700" aria-label="Fechar aviso"><X className="h-4 w-4" /></button>
      <div className="flex gap-3 pr-6">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
          {status.state === 'downloaded' ? <RotateCcw className="h-5 w-5" /> : status.state === 'error' ? <RefreshCw className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900 dark:text-white">{status.state === 'downloaded' ? 'Atualização pronta' : status.state === 'error' ? 'Falha ao atualizar' : 'Atualizando o PetGestor'}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{status.message}</p>
          {status.state === 'downloading' && <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full bg-teal-600 transition-all" style={{ width: `${status.percent || 0}%` }} /></div>}
          {status.state === 'downloaded' && <button onClick={() => void desktop.installUpdate()} className="mt-3 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700">Reiniciar e atualizar</button>}
          {status.state === 'error' && <button onClick={() => void desktop.checkForUpdates()} className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white dark:bg-slate-700">Tentar novamente</button>}
        </div>
      </div>
    </aside>
  );
};
