import React, { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, Plus, Save, Settings, TrendingUp, WalletCards } from 'lucide-react';
import { usePetGestor } from '../../context/AppContext';
import type { FinancialTransaction } from '../../types';
import { formatBRL, formatDate } from '../../utils/formatters';
import { fallbackFinancialPaymentMethods, loadFinancialPaymentMethods, saveFinancialPaymentMethods, type FinancialPaymentMethod } from '../../services/financialRepository';
import { ReportsView } from '../reports/ReportsView';
import { PixPaymentsPanel } from './PixPaymentsPanel';
import { PixReceiptsPanel } from './PixReceiptsPanel';
import { RefundsPanel } from './RefundsPanel';
import { CashHistoryPanel } from './CashHistoryPanel';

type Tab = 'movements' | 'cashflow' | 'reports' | 'settings';
type Period = 'day' | 'week' | 'month' | 'year';
const periodLabels: Record<Period, string> = { day: 'Diária', week: 'Semanal', month: 'Mensal', year: 'Anual' };
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDate = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00`);
const transactionDate = (item: FinancialTransaction) => item.payment_date || item.due_date;

function periodRange(period: Period, anchorValue: string) {
  const anchor = parseDate(anchorValue); const start = new Date(anchor); const end = new Date(anchor);
  if (period === 'week') { const offset = (start.getDay() + 6) % 7; start.setDate(start.getDate() - offset); end.setTime(start.getTime()); end.setDate(end.getDate() + 6); }
  if (period === 'month') { start.setDate(1); end.setFullYear(start.getFullYear(), start.getMonth() + 1, 0); }
  if (period === 'year') { start.setMonth(0, 1); end.setFullYear(start.getFullYear(), 11, 31); }
  return { start: iso(start), end: iso(end) };
}

function PeriodPicker({ period, setPeriod, anchor, setAnchor }: { period: Period; setPeriod: (value: Period) => void; anchor: string; setAnchor: (value: string) => void }) {
  return <div className="flex flex-wrap items-center gap-2">
    <div className="flex rounded-xl border border-slate-200 p-1 dark:border-slate-700">{(Object.keys(periodLabels) as Period[]).map(key => <button key={key} onClick={() => setPeriod(key)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${period === key ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{periodLabels[key]}</button>)}</div>
    <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs"><CalendarDays className="h-4 w-4 text-teal-600"/><input type="date" value={anchor} onChange={event => setAnchor(event.target.value)} className="bg-transparent"/></label>
  </div>;
}

export const FinancialView: React.FC = () => {
  const { company, currentProfile, financialTransactions, addFinancialTransaction, cashRegister, openCashRegister, closeCashRegister, registerCashMovement, addToast } = usePetGestor();
  const [tab, setTab] = useState<Tab>('movements'); const [period, setPeriod] = useState<Period>('month'); const [anchor, setAnchor] = useState(iso(new Date()));
  const [modal, setModal] = useState(false); const [description, setDescription] = useState(''); const [amount, setAmount] = useState(0);
  const [type, setType] = useState<'receita' | 'despesa'>('receita'); const [category, setCategory] = useState('Outros');
  const [dueDate, setDueDate] = useState(iso(new Date())); const [paymentMethod, setPaymentMethod] = useState('pix'); const [status, setStatus] = useState<'pago' | 'pendente'>('pago');
  const [paymentMethods, setPaymentMethods] = useState<FinancialPaymentMethod[]>([]);
  useEffect(() => { loadFinancialPaymentMethods(company.id).then(setPaymentMethods).catch(() => setPaymentMethods(fallbackFinancialPaymentMethods(company.id))); }, [company.id]);
  const activePaymentMethods = paymentMethods.filter(method => method.is_active);
  useEffect(() => { if (activePaymentMethods.length && !activePaymentMethods.some(method => method.code === paymentMethod)) setPaymentMethod(activePaymentMethods[0].code); }, [paymentMethods, paymentMethod]);
  const range = useMemo(() => periodRange(period, anchor), [period, anchor]);
  const scoped = useMemo(() => financialTransactions.filter(item => { const date = transactionDate(item); return date >= range.start && date <= range.end && item.status !== 'cancelado'; }), [financialTransactions, range]);
  const inflow = scoped.filter(item => item.type === 'receita' || item.type === 'suprimento').reduce((sum, item) => sum + Number(item.amount), 0);
  const outflow = scoped.filter(item => item.type === 'despesa' || item.type === 'sangria').reduce((sum, item) => sum + Number(item.amount), 0);
  const canViewReports = ['proprietario','administrador','gerente'].includes(currentProfile.role);
  const canConfigure = ['proprietario','administrador'].includes(currentProfile.role);
  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'movements', label: 'Entradas e saídas', icon: WalletCards }, { id: 'cashflow', label: 'Fluxo de caixa', icon: TrendingUp },
    ...(canViewReports ? [{ id: 'reports' as Tab, label: 'Relatórios', icon: BarChart3 }] : []),
    ...(canConfigure ? [{ id: 'settings' as Tab, label: 'Configurações', icon: Settings }] : []),
  ];
  const add = (event: React.FormEvent) => { event.preventDefault(); if (!description.trim() || amount <= 0 || !activePaymentMethods.some(method => method.code === paymentMethod)) return;
    addFinancialTransaction({ description: description.trim(), amount, type, category, due_date: dueDate, payment_date: status === 'pago' ? dueDate : undefined, status, payment_method: paymentMethod as any });
    setDescription(''); setAmount(0); setModal(false); addToast('Lançamento financeiro salvo.', 'success');
  };
  return <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
    <header><h2 className="flex items-center gap-2 text-xl font-bold"><TrendingUp className="h-6 w-6 text-teal-600"/>Financeiro</h2><p className="text-xs text-slate-500">Entradas, saídas, fluxo de caixa, relatórios e recebimentos em um só lugar.</p></header>
    <nav className="flex gap-2 overflow-x-auto border-b pb-2">{tabs.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => setTab(item.id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold ${tab === item.id ? 'bg-teal-600 text-white' : 'border bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}><Icon className="h-4 w-4"/>{item.label}</button>; })}</nav>
    {tab === 'movements' && <MovementsTab {...{ scoped, inflow, outflow, period, setPeriod, anchor, setAnchor, setModal }} />}
    {tab === 'cashflow' && <CashFlowTab {...{ scoped, inflow, outflow, period, setPeriod, anchor, setAnchor, cashRegister, openCashRegister, closeCashRegister, registerCashMovement }} />}
    {tab === 'reports' && <div className="-m-4 sm:-m-6"><ReportsView /></div>}
    {tab === 'settings' && canConfigure && <SettingsTab methods={paymentMethods} setMethods={setPaymentMethods} addToast={addToast}/>}
    {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4"><form onSubmit={add} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 text-xs shadow-2xl dark:bg-slate-900"><h3 className="text-base font-bold">Novo lançamento</h3>
      <label className="block font-semibold">Descrição<input required value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2"/></label>
      <div className="grid grid-cols-2 gap-3"><label className="font-semibold">Tipo<select value={type} onChange={e => setType(e.target.value as any)} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="receita">Entrada</option><option value="despesa">Saída</option></select></label><label className="font-semibold">Valor<input required min="0.01" step="0.01" type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-2"/></label></div>
      <label className="block font-semibold">Categoria<input required value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2"/></label>
      <div className="grid grid-cols-2 gap-3"><label className="font-semibold">Data<input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2"/></label><label className="font-semibold">Situação<select value={status} onChange={e => setStatus(e.target.value as any)} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="pago">Realizado</option><option value="pendente">Pendente</option></select></label></div>
      <label className="block font-semibold">Forma de recebimento/pagamento<select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2">{activePaymentMethods.map(method => <option key={method.code} value={method.code}>{method.name}</option>)}</select></label>
      <div className="flex justify-end gap-2"><button type="button" onClick={() => setModal(false)} className="rounded-xl border px-4 py-2">Cancelar</button><button disabled={!activePaymentMethods.length} className="rounded-xl bg-teal-600 px-5 py-2 font-bold text-white disabled:opacity-50">Salvar</button></div>
    </form></div>}
  </div>;
};

function Summary({ inflow, outflow }: { inflow: number; outflow: number }) { const result = inflow - outflow; return <div className="grid gap-3 sm:grid-cols-3">{[
  ['Entradas', inflow, 'text-emerald-600', ArrowUpRight], ['Saídas', outflow, 'text-rose-600', ArrowDownRight], ['Saldo do período', result, result >= 0 ? 'text-teal-600' : 'text-rose-600', TrendingUp],
].map(([label, value, tone, Icon]: any) => <div key={label} className="flex items-center justify-between rounded-2xl border bg-white p-5 dark:bg-slate-900"><div><span className="text-[11px] font-bold uppercase text-slate-400">{label}</span><b className={`mt-1 block text-2xl ${tone}`}>{formatBRL(value)}</b></div><Icon className={`h-6 w-6 ${tone}`}/></div>)}</div>; }

function MovementsTab({ scoped, inflow, outflow, period, setPeriod, anchor, setAnchor, setModal }: any) { const [kind, setKind] = useState<'all'|'in'|'out'>('all'); const rows = scoped.filter((item: FinancialTransaction) => kind === 'all' || (kind === 'in' ? ['receita','suprimento'].includes(item.type) : ['despesa','sangria'].includes(item.type)));
  return <section className="space-y-4"><div className="flex flex-col justify-between gap-3 lg:flex-row"><PeriodPicker {...{period,setPeriod,anchor,setAnchor}}/><button onClick={() => setModal(true)} className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4"/>Novo lançamento</button></div><Summary {...{inflow,outflow}}/>
    <div className="overflow-hidden rounded-2xl border bg-white dark:bg-slate-900"><div className="flex items-center justify-between border-b p-4"><h3 className="text-sm font-bold">Movimentações do período</h3><select value={kind} onChange={e => setKind(e.target.value as any)} className="rounded-lg border px-2 py-1 text-xs"><option value="all">Todas</option><option value="in">Entradas</option><option value="out">Saídas</option></select></div><div className="divide-y">{rows.length ? rows.map((item: FinancialTransaction) => { const incoming = ['receita','suprimento'].includes(item.type); return <div key={item.id} className="flex items-center justify-between gap-3 p-4 text-xs"><div><b>{item.description}</b><p className="text-[11px] text-slate-500">{item.category} · {formatDate(transactionDate(item))} · {item.payment_method?.replaceAll('_',' ') || 'Não informado'}</p></div><div className="text-right"><b className={incoming ? 'text-emerald-600' : 'text-rose-600'}>{incoming ? '+' : '-'} {formatBRL(Number(item.amount))}</b><small className="block uppercase text-slate-400">{item.status}</small></div></div>; }) : <p className="p-8 text-center text-xs text-slate-500">Nenhuma movimentação neste período.</p>}</div></div>
  </section>; }

function CashFlowTab({ scoped, inflow, outflow, period, setPeriod, anchor, setAnchor, cashRegister, openCashRegister, closeCashRegister, registerCashMovement }: any) { const paid = scoped.filter((item: FinancialTransaction) => item.status === 'pago'); const points = useMemo(() => { const map = new Map<string,{name:string;Entradas:number;Saídas:number}>(); paid.forEach((item: FinancialTransaction) => { const date = parseDate(transactionDate(item)); const key = period === 'year' ? `${date.getFullYear()}-${date.getMonth()}` : iso(date); const name = period === 'year' ? date.toLocaleDateString('pt-BR',{month:'short'}) : date.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}); const point = map.get(key) || {name,Entradas:0,Saídas:0}; if (['receita','suprimento'].includes(item.type)) point.Entradas += Number(item.amount); else point.Saídas += Number(item.amount); map.set(key,point); }); return [...map.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([,value]) => value); }, [paid,period]);
  return <section className="space-y-4"><PeriodPicker {...{period,setPeriod,anchor,setAnchor}}/><Summary inflow={paid.filter((x:FinancialTransaction)=>['receita','suprimento'].includes(x.type)).reduce((s:number,x:FinancialTransaction)=>s+Number(x.amount),0)} outflow={paid.filter((x:FinancialTransaction)=>['despesa','sangria'].includes(x.type)).reduce((s:number,x:FinancialTransaction)=>s+Number(x.amount),0)}/><div className="rounded-2xl border bg-white p-5 dark:bg-slate-900"><h3 className="mb-4 text-sm font-bold">Fluxo de caixa realizado</h3><div className="h-72">{points.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={points}><CartesianGrid strokeDasharray="3 3" opacity={.2}/><XAxis dataKey="name" fontSize={10}/><YAxis fontSize={10}/><Tooltip formatter={(value:any)=>formatBRL(Number(value))}/><Area type="monotone" dataKey="Entradas" stroke="#10b981" fill="#10b981" fillOpacity={.18}/><Area type="monotone" dataKey="Saídas" stroke="#f43f5e" fill="#f43f5e" fillOpacity={.14}/></AreaChart></ResponsiveContainer> : <div className="grid h-full place-items-center text-xs text-slate-500">Sem valores realizados neste período.</div>}</div></div>
    <div className="rounded-2xl border bg-white p-4 dark:bg-slate-900"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-bold">Caixa operacional</h3><span className={`text-[10px] font-bold uppercase ${cashRegister.status==='aberto'?'text-emerald-600':'text-slate-500'}`}>{cashRegister.status}</span></div><div className="flex flex-wrap gap-2">{cashRegister.status === 'fechado' ? <button onClick={async()=>{const value=Number(prompt('Valor inicial em dinheiro:','0'));if(value>=0)await openCashRegister(value)}} className="rounded-xl border px-3 py-2 text-xs font-bold">Abrir caixa</button> : <><button onClick={async()=>{const value=Number(prompt('Valor da sangria:','0'));const reason=prompt('Motivo:','Retirada do caixa');if(value>0&&reason)await registerCashMovement('sangria',value,reason)}} className="rounded-xl border px-3 py-2 text-xs">Sangria</button><button onClick={async()=>{const value=Number(prompt('Valor do suprimento:','0'));const reason=prompt('Motivo:','Reforço do caixa');if(value>0&&reason)await registerCashMovement('suprimento',value,reason)}} className="rounded-xl border px-3 py-2 text-xs">Suprimento</button><button onClick={async()=>{const value=Number(prompt('Dinheiro contado:','0'));if(value>=0)await closeCashRegister(value)}} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">Fechar caixa</button></>}</div></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs md:grid-cols-4"><span>Dinheiro <b className="block">{formatBRL(cashRegister.total_sales_cash||0)}</b></span><span>Pix <b className="block">{formatBRL(cashRegister.total_sales_pix||0)}</b></span><span>Cartões <b className="block">{formatBRL(cashRegister.total_sales_card||0)}</b></span><span>Créditos <b className="block">{formatBRL(cashRegister.total_sales_credit||0)}</b></span></div></div><CashHistoryPanel/>
  </section>; }

function SettingsTab({ methods, setMethods, addToast }: { methods: FinancialPaymentMethod[]; setMethods: React.Dispatch<React.SetStateAction<FinancialPaymentMethod[]>>; addToast: (message:string,type?:any)=>void }) { const [saving,setSaving]=useState(false); const update=(index:number,patch:Partial<FinancialPaymentMethod>)=>setMethods(rows=>rows.map((row,i)=>i===index?{...row,...patch}:row)); const save=async()=>{setSaving(true);try{setMethods(await saveFinancialPaymentMethods(methods));addToast('Formas de recebimento salvas.','success')}catch(error){addToast(error instanceof Error?error.message:'Erro ao salvar.','error')}finally{setSaving(false)}};
  return <section className="space-y-5"><div className="rounded-2xl border bg-white p-5 dark:bg-slate-900"><div className="flex items-center justify-between"><div><h3 className="text-sm font-bold">Formas de recebimento</h3><p className="text-xs text-slate-500">Defina quais formas ficarão disponíveis nos recebimentos, no PDV e nas comandas.</p></div><button disabled={saving||!methods.length} onClick={save} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><Save className="h-4 w-4"/>{saving?'Salvando...':'Salvar'}</button></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs"><thead className="text-slate-400"><tr><th className="p-2">Ativa</th><th className="p-2">Forma de recebimento</th></tr></thead><tbody>{methods.map((method,index)=><tr key={method.code} className="border-t"><td className="p-2"><input type="checkbox" checked={method.is_active} onChange={e=>update(index,{is_active:e.target.checked})}/></td><td className="p-2"><input value={method.name} onChange={e=>update(index,{name:e.target.value})} className="w-full rounded-lg border px-2 py-1.5"/></td></tr>)}</tbody></table></div></div><PixPaymentsPanel/><PixReceiptsPanel/><RefundsPanel/></section>; }
