import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, History, RefreshCw, Search } from 'lucide-react';
import { usePetGestor } from '../../context/AppContext';
import { loadAuditLogs } from '../../services/auditRepository';
import type { AuditLog } from '../../types';

const entityLabels: Record<string, string> = {
  companies: 'PetShop', profiles: 'Funcionários', customers: 'Clientes', pets: 'Pets', services: 'Serviços',
  appointments: 'Agenda', products: 'Produtos', stock_movements: 'Estoque', sales: 'Vendas',
  service_orders: 'Comandas', financial_transactions: 'Financeiro', cash_registers: 'Caixa',
  cash_movements: 'Movimentações do caixa', employee_invites: 'Convites', blocked_times: 'Bloqueios da agenda',
};
const actionLabels = { INSERT: 'Criação', UPDATE: 'Alteração', DELETE: 'Exclusão' } as const;

export const AuditView: React.FC = () => {
  const { company, addToast } = usePetGestor();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const refresh = async () => {
    setLoading(true);
    try { setLogs(await loadAuditLogs(company.id, entity || undefined)); }
    catch { addToast('Não foi possível carregar a auditoria.', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, [company.id, entity]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter(log => [log.actor_name, log.entity_type, log.action, log.entity_id].some(value => String(value || '').toLowerCase().includes(term)));
  }, [logs, search]);

  const formatDate = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'America/Sao_Paulo' }).format(new Date(value));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h2 className="flex items-center gap-2 text-2xl font-bold"><History className="h-6 w-6 text-teal-600" />Auditoria</h2><p className="mt-1 text-sm text-slate-500">Histórico permanente de alterações importantes no PetShop.</p></div>
        <button onClick={() => void refresh()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Atualizar</button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_260px] dark:border-slate-800 dark:bg-slate-900">
        <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar usuário, ação ou registro" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950" /></label>
        <select value={entity} onChange={event => setEntity(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950"><option value="">Todos os módulos</option>{Object.entries(entityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? <p className="p-8 text-center text-sm text-slate-500">Carregando histórico...</p> : filtered.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Nenhum registro encontrado.</p> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{filtered.map(log => {
          const isOpen = expanded === log.id;
          return <div key={log.id}>
            <button onClick={() => setExpanded(isOpen ? null : log.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 p-4 text-left hover:bg-slate-50 sm:grid-cols-[150px_170px_1fr_180px_auto] dark:hover:bg-slate-800/50">
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${log.action === 'DELETE' ? 'bg-red-100 text-red-700' : log.action === 'UPDATE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{actionLabels[log.action]}</span>
              <span className="hidden text-sm font-semibold sm:block">{entityLabels[log.entity_type] || log.entity_type}</span>
              <span className="min-w-0 truncate text-sm text-slate-600 dark:text-slate-300">{log.actor_name}</span>
              <span className="hidden text-xs text-slate-500 sm:block">{formatDate(log.created_at)}</span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isOpen && <div className="grid gap-3 bg-slate-50 p-4 md:grid-cols-2 dark:bg-slate-950/60">
              <div><p className="mb-1 text-xs font-bold uppercase text-slate-500">Antes</p><pre className="max-h-72 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-200">{log.before_data ? JSON.stringify(log.before_data, null, 2) : '—'}</pre></div>
              <div><p className="mb-1 text-xs font-bold uppercase text-slate-500">Depois</p><pre className="max-h-72 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-200">{log.after_data ? JSON.stringify(log.after_data, null, 2) : '—'}</pre></div>
            </div>}
          </div>;
        })}</div>}
      </section>
    </div>
  );
};
