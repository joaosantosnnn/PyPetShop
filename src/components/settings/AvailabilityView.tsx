import React, { useEffect, useMemo, useState } from 'react';
import { Ban, CalendarOff, Clock, Trash2 } from 'lucide-react';
import { usePetGestor } from '../../context/AppContext';
import { createBlockedTime, deleteBlockedTime, loadBlockedTimes } from '../../services/scheduleRepository';
import type { BlockedTime } from '../../types';

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900';
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

export const AvailabilityView: React.FC = () => {
  const { company, currentProfile, allProfiles, addToast } = usePetGestor();
  const [items, setItems] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wholeDay, setWholeDay] = useState(true);
  const [date, setDate] = useState(today());
  const [startTime, setStartTime] = useState(company.opening_time.slice(0, 5));
  const [endTime, setEndTime] = useState(company.closing_time.slice(0, 5));
  const [employeeId, setEmployeeId] = useState('');
  const [reason, setReason] = useState('');

  const professionals = useMemo(
    () => allProfiles.filter(profile => profile.is_active && ['banhista', 'tosador', 'atendente', 'gerente'].includes(profile.role)),
    [allProfiles],
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadBlockedTimes(company.id)
      .then(data => { if (active) setItems(data); })
      .catch(() => { if (active) addToast('Não foi possível carregar os bloqueios da agenda.', 'error'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [company.id]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const start = wholeDay ? new Date(`${date}T00:00:00-03:00`) : new Date(`${date}T${startTime}:00-03:00`);
    const end = wholeDay ? new Date(`${date}T23:59:59-03:00`) : new Date(`${date}T${endTime}:00-03:00`);
    if (end <= start) return addToast('O horário final precisa ser posterior ao inicial.', 'warning');
    setSaving(true);
    try {
      const created = await createBlockedTime({
        company_id: company.id,
        employee_id: employeeId || null,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        reason: reason.trim(),
        created_by: currentProfile.id,
      });
      setItems(previous => [...previous, created].sort((a, b) => a.start_at.localeCompare(b.start_at)));
      setReason('');
      addToast('Indisponibilidade registrada na agenda.', 'success');
    } catch {
      addToast('Não foi possível registrar a indisponibilidade.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: BlockedTime) => {
    try {
      await deleteBlockedTime(item.id, company.id);
      setItems(previous => previous.filter(current => current.id !== item.id));
      addToast('Bloqueio removido da agenda.', 'success');
    } catch {
      addToast('Não foi possível remover o bloqueio.', 'error');
    }
  };

  const employeeName = (id?: string | null) => id ? allProfiles.find(profile => profile.id === id)?.full_name || 'Profissional' : 'PetShop inteiro';
  const formatDate = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(value));

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold"><CalendarOff className="h-6 w-6 text-teal-600" />Bloqueios da agenda</h2>
        <p className="mt-1 text-sm text-slate-500">Cadastre feriados, folgas e períodos indisponíveis. O sistema impedirá novos agendamentos nesses intervalos.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-bold">Nova indisponibilidade</h3>
          <label className="block text-sm font-medium">Data<input type="date" min={today()} className={`${fieldClass} mt-1`} value={date} onChange={event => setDate(event.target.value)} required /></label>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={wholeDay} onChange={event => setWholeDay(event.target.checked)} className="h-4 w-4 accent-teal-600" />Bloquear o dia inteiro</label>
          {!wholeDay && <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">Início<input type="time" className={`${fieldClass} mt-1`} value={startTime} onChange={event => setStartTime(event.target.value)} required /></label>
            <label className="text-sm font-medium">Fim<input type="time" className={`${fieldClass} mt-1`} value={endTime} onChange={event => setEndTime(event.target.value)} required /></label>
          </div>}
          <label className="block text-sm font-medium">Aplicar a<select className={`${fieldClass} mt-1`} value={employeeId} onChange={event => setEmployeeId(event.target.value)}><option value="">PetShop inteiro</option>{professionals.map(profile => <option key={profile.id} value={profile.id}>{profile.full_name} — {profile.role}</option>)}</select></label>
          <label className="block text-sm font-medium">Motivo<input className={`${fieldClass} mt-1`} placeholder="Ex.: feriado, folga ou manutenção" value={reason} onChange={event => setReason(event.target.value)} required /></label>
          <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"><Ban className="h-4 w-4" />{saving ? 'Salvando...' : 'Bloquear período'}</button>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 font-bold">Próximas indisponibilidades</h3>
          {loading ? <p className="text-sm text-slate-500">Carregando...</p> : items.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">Nenhum bloqueio futuro cadastrado.</div> : <div className="space-y-3">{items.map(item => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <Clock className="h-5 w-5 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1"><p className="font-semibold">{item.reason}</p><p className="text-xs text-slate-500">{employeeName(item.employee_id)} · {formatDate(item.start_at)} até {formatDate(item.end_at)}</p></div>
            <button type="button" onClick={() => remove(item)} aria-label="Remover bloqueio" className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"><Trash2 className="h-4 w-4" /></button>
          </div>)}</div>}
        </section>
      </div>
    </div>
  );
};
