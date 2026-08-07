import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, RefreshCw, RotateCcw } from 'lucide-react';
import type { DesktopUpdateStatus } from '../common/DesktopUpdater';

export const DesktopUpdateSettings: React.FC = () => {
  const desktop = window.petGestorDesktop;
  const [status, setStatus] = useState<DesktopUpdateStatus>({ state: desktop ? 'idle' : 'development' });

  useEffect(() => {
    if (!desktop) return;
    void desktop.getUpdateStatus().then(setStatus);
    return desktop.onUpdateStatus(setStatus);
  }, [desktop]);

  if (!desktop) return null;
  const busy = ['checking', 'available', 'downloading'].includes(status.state);

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><Download className="h-5 w-5" /></div>
          <div><h3 className="font-bold text-slate-900 dark:text-white">Atualizações do PetGestor</h3><p className="text-sm text-slate-500">Versão instalada: {status.version || 'consultando...'}</p><p className="mt-1 text-xs text-slate-500">{status.message || 'O aplicativo verifica novas versões automaticamente.'}</p></div>
        </div>
        {status.state === 'downloaded' ? (
          <button onClick={() => void desktop.installUpdate()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white"><RotateCcw className="h-4 w-4" />Reiniciar e atualizar</button>
        ) : (
          <button disabled={busy} onClick={() => void desktop.checkForUpdates()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 dark:bg-slate-700">{busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{busy ? `Baixando ${status.percent || 0}%` : 'Buscar atualizações'}</button>
        )}
      </div>
    </section>
  );
};
