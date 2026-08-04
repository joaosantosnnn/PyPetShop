import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Calendar, CheckCircle, Clock, DollarSign, Package, Phone, Plus, RefreshCw, Scissors, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePetGestor } from '../../context/AppContext';
import { loadDashboardSummary, type DashboardSummary } from '../../services/dashboardRepository';
import { canAccessView } from '../../utils/permissions';
import { formatBRL, formatTime } from '../../utils/formatters';
import { buildPetReadyMessage, generateWhatsAppLink } from '../../utils/whatsapp';

export const DashboardView: React.FC = () => {
  const { appointments, currentProfile, products, setCurrentView, updateAppointmentStatus } = usePetGestor();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const role = currentProfile.role;
  const financial = canAccessView(role, 'financial');
  const operational = canAccessView(role, 'appointments');
  const inventory = canAccessView(role, 'products');

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try { setSummary(await loadDashboardSummary()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível atualizar o painel.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh, currentProfile.id]);

  const todayAppointments = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
    const today = formatter.format(new Date());
    return appointments.filter(item => formatter.format(new Date(item.scheduled_at)) === today && !['cancelado', 'nao_compareceu', 'entregue'].includes(item.status));
  }, [appointments]);
  const lowStockProducts = inventory ? products.filter(product => product.is_active !== false && product.current_stock <= product.min_stock) : [];
  const chartData = (summary?.daily_flow ?? []).map(item => ({ day: new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${item.date}T12:00:00Z`)).replace('.', ''), receita: item.revenue, despesa: item.expense }));

  const metricCards = [
    financial && { label: 'Faturamento hoje', value: formatBRL(summary?.revenue_today ?? 0), detail: `${summary?.sales_today ?? 0} recebimentos`, icon: DollarSign, color: 'emerald' },
    financial && { label: 'Faturamento do mês', value: formatBRL(summary?.revenue_month ?? 0), detail: summary?.open_cash ? 'Caixa aberto' : 'Caixa fechado', icon: TrendingUp, color: 'teal' },
    operational && { label: 'Em atendimento', value: `${summary?.in_service ?? 0} pets`, detail: 'Banho, secagem e tosa', icon: Scissors, color: 'amber' },
    operational && { label: 'Prontos para entrega', value: `${summary?.ready_for_pickup ?? 0} pets`, detail: 'Aguardando tutores', icon: CheckCircle, color: 'teal' },
    inventory && { label: 'Estoque baixo', value: `${summary?.low_stock ?? 0} produtos`, detail: `${summary?.out_of_stock ?? 0} sem estoque`, icon: Package, color: 'amber' },
  ].filter(Boolean) as Array<{label:string;value:string;detail:string;icon:React.ComponentType<{className?:string}>;color:string}>;

  return <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
    <div className="bg-slate-900 rounded-xl p-6 text-white shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div><h2 className="text-xl font-bold tracking-tight">Painel Operacional PetShop</h2><p className="text-slate-400 text-sm mt-1">Indicadores do negócio atualizados diretamente do sistema.</p></div>
      <div className="flex flex-wrap items-center gap-2.5">
        {operational && <button onClick={() => setCurrentView('appointments')} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-xs font-semibold"><Plus className="w-4 h-4"/> Novo agendamento</button>}
        {canAccessView(role,'pos') && <button onClick={() => setCurrentView('pos')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-semibold"><ShoppingBag className="w-4 h-4"/> Nova venda</button>}
        {canAccessView(role,'customers') && <button onClick={() => setCurrentView('customers')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold border border-slate-700"><Users className="w-4 h-4 text-teal-400"/> Clientes</button>}
        <button onClick={() => void refresh()} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold border border-slate-700 disabled:opacity-60"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/> Atualizar</button>
      </div>
    </div>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{metricCards.map(card => <div key={card.label} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p><p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading?'—':card.value}</p><p className="text-xs text-slate-500 mt-1">{card.detail}</p></div><div className={`w-11 h-11 rounded-lg bg-${card.color}-50 dark:bg-${card.color}-950 text-${card.color}-600 flex items-center justify-center`}><card.icon className="w-5 h-5"/></div></div>)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {financial && <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"><div className="flex justify-between mb-4"><div><h3 className="font-bold text-slate-900 dark:text-white">Fluxo dos últimos 7 dias</h3><p className="text-xs text-slate-500">Receitas recebidas e despesas pagas</p></div><button onClick={() => setCurrentView('financial')} className="text-xs font-semibold text-teal-600">Ver financeiro</button></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:10,right:10,left:-20,bottom:0}}><CartesianGrid strokeDasharray="3 3" opacity={0.1}/><XAxis dataKey="day" stroke="#94a3b8" fontSize={12}/><YAxis stroke="#94a3b8" fontSize={12}/><Tooltip formatter={(value:number)=>formatBRL(Number(value))}/><Area type="monotone" dataKey="receita" stroke="#0d9488" fill="#0d9488" fillOpacity={0.18}/><Area type="monotone" dataKey="despesa" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.14}/></AreaChart></ResponsiveContainer></div></div>}
      <div className="space-y-4">
        {inventory && <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"><div className="flex justify-between mb-3"><h4 className="text-sm font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500"/> Alertas de estoque ({summary?.low_stock ?? 0})</h4><button onClick={() => setCurrentView('products')} className="text-xs text-teal-600 font-semibold">Ver todos</button></div>{lowStockProducts.length===0?<p className="text-xs text-slate-500">Estoque em nível adequado.</p>:lowStockProducts.slice(0,3).map(product=><div key={product.id} className="p-2.5 mb-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200"><p className="text-xs font-bold">{product.name}</p><p className="text-[11px] text-amber-700">Atual: {product.current_stock} {product.unit} · mínimo: {product.min_stock}</p></div>)}</div>}
        {financial && <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"><h4 className="text-sm font-bold flex items-center gap-2"><DollarSign className="w-4 h-4 text-rose-500"/> Resumo financeiro</h4><div className="mt-3 space-y-2 text-xs"><p className="flex justify-between"><span>Contas a pagar</span><strong className="text-rose-600">{formatBRL(summary?.expenses_due ?? 0)}</strong></p><p className="flex justify-between"><span>Contas a receber</span><strong className="text-emerald-600">{formatBRL(summary?.receivables_due ?? 0)}</strong></p><p className="flex justify-between"><span>Estornos pendentes</span><strong>{summary?.pending_refunds ?? 0}</strong></p></div></div>}
      </div>
    </div>
    {operational && <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"><div className="flex items-center justify-between mb-4"><div><h3 className="font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-teal-600"/> Agenda de hoje</h3><p className="text-xs text-slate-500">{summary?.appointments_today ?? todayAppointments.length} atendimentos ativos</p></div><button onClick={() => setCurrentView('appointments')} className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 font-bold text-xs"><Calendar className="w-3.5 h-3.5 inline mr-1"/> Abrir agenda</button></div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b text-[11px] uppercase text-slate-400"><th className="p-3">Horário</th><th className="p-3">Pet / tutor</th><th className="p-3">Serviço</th><th className="p-3">Status</th><th className="p-3 text-right">Ação</th></tr></thead><tbody className="divide-y">{todayAppointments.length===0?<tr><td colSpan={5} className="p-6 text-center text-sm text-slate-500">Nenhum atendimento ativo para hoje.</td></tr>:todayAppointments.map(item=><tr key={item.id}><td className="p-3 font-bold">{formatTime(item.scheduled_at)}</td><td className="p-3"><strong>{item.pet_name}</strong><div className="text-[11px] text-slate-500">{item.customer_name}</div></td><td className="p-3">{item.service_name}</td><td className="p-3 capitalize">{item.status.replaceAll('_',' ')}</td><td className="p-3 text-right">{item.status==='pronto'?<a href={generateWhatsAppLink(item.customer_phone||'',buildPetReadyMessage(item.customer_name||'Tutor',item.pet_name||'Pet'))} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs"><Phone className="w-3.5 h-3.5"/> Avisar tutor</a>:<button onClick={()=>updateAppointmentStatus(item.id,'pronto')} className="px-2.5 py-1 border rounded-lg text-[11px]">Marcar pronto</button>}</td></tr>)}</tbody></table></div></div>}
  </div>;
};
