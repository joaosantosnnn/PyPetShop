import React, { useEffect, useState } from 'react';
import { Check, Inbox, X } from 'lucide-react';
import { usePetGestor } from '../../context/AppContext';
import {
  approvePortalRequest,
  loadPortalRequests,
  rejectPortalRequest,
  type PortalRequest,
} from '../../services/portalRequestRepository';

export const PortalRequestsPanel: React.FC = () => {
  const { company, allProfiles, addToast, reloadData } = usePetGestor();
  const [rows, setRows] = useState<PortalRequest[]>([]);
  const [selected, setSelected] = useState<PortalRequest | null>(null);

  const refresh = () => loadPortalRequests(company.id).then(setRows).catch(() => undefined);

  useEffect(() => {
    void refresh();
  }, [company.id]);

  const pending = rows.filter(request => request.status === 'pendente');

  const approve = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    try {
      await approvePortalRequest(
        selected.id,
        String(form.get('scheduled')),
        String(form.get('employee')),
        String(form.get('note')),
      );
      setSelected(null);
      await Promise.all([refresh(), reloadData()]);
      addToast('Solicitação convertida em agendamento.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Erro ao aprovar solicitação.', 'error');
    }
  };

  const reject = async (request: PortalRequest) => {
    const note = prompt('Motivo da recusa:');
    if (!note) return;
    try {
      await rejectPortalRequest(request.id, note);
      await refresh();
      addToast('Solicitação recusada.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Erro ao recusar solicitação.', 'error');
    }
  };

  return (
    <section className="rounded-2xl border bg-white p-4 dark:bg-slate-900">
      <h3 className="flex gap-2 font-bold">
        <Inbox className="text-teal-600" /> Solicitações do portal
        <span className="rounded-full bg-teal-600 px-2 text-xs text-white">{pending.length}</span>
      </h3>
      {pending.length ? (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {pending.map(request => (
            <div key={request.id} className="rounded-xl border p-3 text-xs">
              <b>{request.customer?.name} · {request.pet?.name}</b>
              <p>{request.service?.name} · {new Date(`${request.preferred_date}T12:00`).toLocaleDateString('pt-BR')} ({request.preferred_period})</p>
              <p className="text-slate-500">{request.notes}</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => setSelected(request)} className="rounded-lg bg-emerald-600 px-3 py-1 text-white"><Check className="inline w-3" /> Aprovar</button>
                <button onClick={() => void reject(request)} className="rounded-lg border px-3 py-1 text-rose-600"><X className="inline w-3" /> Recusar</button>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="mt-2 text-xs text-slate-500">Nenhuma solicitação pendente.</p>}
      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
          <form onSubmit={approve} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 dark:bg-slate-900">
            <h3 className="font-bold">Confirmar horário</h3>
            <input name="scheduled" type="datetime-local" required className="w-full rounded-xl border p-2" />
            <select name="employee" className="w-full rounded-xl border p-2">
              <option value="">Sem profissional definido</option>
              {allProfiles.filter(profile => profile.is_active).map(profile => <option key={profile.id} value={profile.id}>{profile.full_name}</option>)}
            </select>
            <textarea name="note" placeholder="Resposta ao cliente" className="w-full rounded-xl border p-2" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSelected(null)} className="rounded-xl border px-3 py-2">Cancelar</button>
              <button className="rounded-xl bg-emerald-600 px-3 py-2 font-bold text-white">Criar agendamento</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
