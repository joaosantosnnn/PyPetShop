import React, { useEffect, useState } from 'react';
import { usePetGestor, AppView } from '../../context/AppContext';
import {
  LayoutDashboard, Calendar, Scissors, ClipboardList, ShoppingCart, Users, Dog,
  Sparkles, Package, Truck, DollarSign, UserCheck, HeartHandshake, FileText,
  ShieldAlert, Settings, CalendarOff, MessageCircle, DatabaseBackup,
  ChevronDown, BriefcaseBusiness, ContactRound, Boxes, BadgeDollarSign, Wrench,
} from 'lucide-react';
import { canAccessView } from '../../utils/permissions';

interface NavItem { id: AppView; label: string; icon: React.ElementType; badge?: number }
interface NavGroup { id: string; label: string; icon: React.ElementType; items: NavItem[] }

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, currentProfile, company, appointments, products } = usePetGestor();
  const pendingAppointments = appointments.filter(item => item.status === 'agendado' || item.status === 'recebido').length;
  const lowStockCount = products.filter(item => item.current_stock <= item.min_stock).length;

  const shortcuts: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Agenda', icon: Calendar, badge: pendingAppointments },
    { id: 'pos', label: 'Frente de Caixa (PDV)', icon: ShoppingCart },
    { id: 'customers', label: 'Clientes & Pets', icon: Users },
  ];

  const groups: NavGroup[] = [
    { id: 'atendimento', label: 'Atendimento', icon: BriefcaseBusiness, items: [
      { id: 'operation', label: 'Banho & Tosa', icon: Scissors },
      { id: 'comandas', label: 'Comandas', icon: ClipboardList },
      { id: 'delivery', label: 'Busca & Entrega', icon: Truck },
      { id: 'availability', label: 'Bloqueios da Agenda', icon: CalendarOff },
    ] },
    { id: 'cadastros', label: 'Cadastros', icon: ContactRound, items: [
      { id: 'pets', label: 'Cadastro de Pets', icon: Dog },
      { id: 'services', label: 'Serviços', icon: Sparkles },
      { id: 'communications', label: 'Comunicação & WhatsApp', icon: MessageCircle },
      { id: 'consent', label: 'Termos & Incidentes', icon: FileText },
    ] },
    { id: 'vendas', label: 'Vendas', icon: BadgeDollarSign, items: [
      { id: 'products', label: 'Produtos', icon: Package, badge: lowStockCount },
      { id: 'loyalty', label: 'Fidelidade & Pacotes', icon: HeartHandshake },
    ] },
    { id: 'estoque', label: 'Estoque', icon: Boxes, items: [
      { id: 'stock', label: 'Estoque & Lotes', icon: Package, badge: lowStockCount },
      { id: 'suppliers', label: 'Fornecedores', icon: Truck },
      { id: 'purchases', label: 'Pedidos de Compra', icon: ClipboardList },
    ] },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign, items: [
      { id: 'financial', label: 'Gestão Financeira', icon: DollarSign },
    ] },
    { id: 'administracao', label: 'Administração', icon: Wrench, items: [
      { id: 'employees', label: 'Funcionários & Comissões', icon: UserCheck },
      { id: 'audit', label: 'Auditoria', icon: ShieldAlert },
      { id: 'settings', label: 'Configurações', icon: Settings },
      { id: 'data-management', label: 'Backup & Dados', icon: DatabaseBackup },
    ] },
  ];

  const allowed = (item: NavItem) => canAccessView(currentProfile.role, item.id);
  const visibleGroups = groups.map(group => ({ ...group, items: group.items.filter(allowed) })).filter(group => group.items.length > 0);
  const activeGroup = visibleGroups.find(group => group.items.some(item => item.id === currentView))?.id;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeGroup) setOpenGroups(previous => ({ ...previous, [activeGroup]: true }));
  }, [activeGroup]);

  const openView = (view: AppView) => setCurrentView(view);
  const itemButton = (item: NavItem, nested = false) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;
    return <button key={item.id} onClick={() => openView(item.id)} className={`group flex w-full items-center gap-3 rounded-lg py-2.5 pr-3 text-sm transition-colors ${nested ? 'pl-9' : 'pl-3'} ${isActive ? 'bg-teal-50 font-semibold text-teal-700 dark:bg-teal-950/80 dark:text-teal-300' : 'font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'}`}>
      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500'}`} />
      <span className="flex-1 truncate text-left">{item.label}</span>
      {!!item.badge && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{item.badge}</span>}
    </button>;
  };

  return <aside className="hidden w-64 shrink-0 select-none flex-col border-r border-slate-200 bg-white text-slate-700 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 lg:flex">
    <div className="flex items-center gap-3 border-b border-slate-100 p-5 dark:border-slate-800"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs"><Dog className="h-6 w-6" /></div><div className="min-w-0 flex-1"><h1 className="truncate text-xl font-bold tracking-tight text-teal-800 dark:text-teal-400">{company.trade_name || company.name || 'PetGestor'}</h1><p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">Gestão Integrada</p></div></div>
    <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-4">
      {shortcuts.filter(allowed).map(item => itemButton(item))}
      <div className="my-3 border-t border-slate-100 dark:border-slate-800" />
      {visibleGroups.map(group => { const GroupIcon = group.icon; const isOpen = !!openGroups[group.id]; const hasActive = group.id === activeGroup; return <div key={group.id}>
        <button onClick={() => setOpenGroups(previous => ({ ...previous, [group.id]: !previous[group.id] }))} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${hasActive ? 'text-teal-700 dark:text-teal-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}><GroupIcon className="h-4 w-4" /><span className="flex-1 text-left">{group.label}</span><ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>
        {isOpen && <div className="mt-1 space-y-1 border-l border-slate-200 dark:border-slate-700">{group.items.map(item => itemButton(item, true))}</div>}
      </div>; })}
    </div>
    <div className="space-y-2 border-t border-slate-100 p-4 dark:border-slate-800"><div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-700/50 dark:bg-slate-800/60"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold uppercase text-white">{currentProfile.full_name.charAt(0)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{currentProfile.full_name}</p><p className="truncate text-xs capitalize text-slate-500 dark:text-slate-400">{currentProfile.role}</p></div></div></div>
  </aside>;
};
