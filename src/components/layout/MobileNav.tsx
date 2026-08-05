import React, { useState } from 'react';
import { usePetGestor, AppView } from '../../context/AppContext';
import {
  LayoutDashboard, Calendar, Scissors, ShoppingCart, Menu, X, Dog, Users,
  Sparkles, Package, DollarSign, Truck, Settings, FileText, BarChart3, UserCheck,
  HeartHandshake, ClipboardList, ShieldAlert, CalendarOff, MessageCircle,
  DatabaseBackup, ChevronDown, BriefcaseBusiness, ContactRound, Boxes,
  BadgeDollarSign, Wrench,
} from 'lucide-react';
import { canAccessView } from '../../utils/permissions';

type MobileItem = { id: AppView; label: string; icon: React.ElementType };
type MobileGroup = { id: string; label: string; icon: React.ElementType; items: MobileItem[] };

export const MobileNav: React.FC = () => {
  const { currentView, setCurrentView, company, currentProfile } = usePetGestor();
  const [isOpen, setIsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const shortcuts: MobileItem[] = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'appointments', label: 'Agenda', icon: Calendar },
    { id: 'pos', label: 'PDV', icon: ShoppingCart },
    { id: 'customers', label: 'Clientes', icon: Users },
  ];
  const groups: MobileGroup[] = [
    { id: 'atendimento', label: 'Atendimento', icon: BriefcaseBusiness, items: [
      { id: 'operation', label: 'Banho & Tosa', icon: Scissors }, { id: 'comandas', label: 'Comandas', icon: ClipboardList },
      { id: 'delivery', label: 'Busca & Entrega', icon: Truck }, { id: 'availability', label: 'Bloqueios da Agenda', icon: CalendarOff },
    ] },
    { id: 'cadastros', label: 'Cadastros', icon: ContactRound, items: [
      { id: 'pets', label: 'Cadastro de Pets', icon: Dog }, { id: 'services', label: 'Serviços', icon: Sparkles },
      { id: 'communications', label: 'Comunicação & WhatsApp', icon: MessageCircle }, { id: 'consent', label: 'Termos & Incidentes', icon: FileText },
    ] },
    { id: 'vendas', label: 'Vendas', icon: BadgeDollarSign, items: [
      { id: 'products', label: 'Produtos', icon: Package }, { id: 'loyalty', label: 'Fidelidade & Pacotes', icon: HeartHandshake },
    ] },
    { id: 'estoque', label: 'Estoque', icon: Boxes, items: [
      { id: 'stock', label: 'Estoque & Lotes', icon: Package }, { id: 'suppliers', label: 'Fornecedores', icon: Truck },
      { id: 'purchases', label: 'Pedidos de Compra', icon: ClipboardList },
    ] },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign, items: [
      { id: 'financial', label: 'Fluxo de Caixa', icon: DollarSign }, { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    ] },
    { id: 'administracao', label: 'Administração', icon: Wrench, items: [
      { id: 'employees', label: 'Funcionários & Comissões', icon: UserCheck }, { id: 'audit', label: 'Auditoria', icon: ShieldAlert },
      { id: 'settings', label: 'Configurações', icon: Settings }, { id: 'data-management', label: 'Backup & Dados', icon: DatabaseBackup },
    ] },
  ];

  const allowed = (item: MobileItem) => canAccessView(currentProfile.role, item.id);
  const visibleGroups = groups.map(group => ({ ...group, items: group.items.filter(allowed) })).filter(group => group.items.length);
  const goTo = (view: AppView) => { setCurrentView(view); setIsOpen(false); };

  return <>
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white px-2 shadow-lg dark:border-slate-800 dark:bg-slate-900 lg:hidden">
      {shortcuts.filter(allowed).map(tab => { const Icon = tab.icon; const active = currentView === tab.id; return <button key={tab.id} onClick={() => setCurrentView(tab.id)} className={`flex w-14 flex-col items-center justify-center rounded-xl py-1 transition ${active ? 'font-bold text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}><Icon className="h-5 w-5" /><span className="mt-0.5 text-[10px]">{tab.label}</span></button>; })}
      <button onClick={() => setIsOpen(true)} className="flex w-14 flex-col items-center justify-center rounded-xl py-1 text-slate-500 hover:text-teal-600 dark:text-slate-400"><Menu className="h-5 w-5" /><span className="mt-0.5 text-[10px]">Menu</span></button>
    </nav>
    {isOpen && <div className="fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-sm lg:hidden">
      <div className="flex h-full w-4/5 max-w-xs flex-col bg-slate-900 p-4 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4"><div className="flex min-w-0 items-center gap-2"><Dog className="h-6 w-6 shrink-0 text-teal-400" /><span className="truncate text-lg font-bold">{company.trade_name || company.name || 'PetGestor'}</span></div><button onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-white"><X className="h-6 w-6" /></button></div>
        <div className="flex-1 space-y-1 overflow-y-auto py-4">
          {shortcuts.filter(allowed).map(item => { const Icon = item.icon; const active = currentView === item.id; return <button key={item.id} onClick={() => goTo(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active ? 'bg-teal-600 font-bold text-white' : 'text-slate-300 hover:bg-slate-800'}`}><Icon className="h-4 w-4 text-teal-400" />{item.label}</button>; })}
          <div className="my-3 border-t border-slate-800" />
          {visibleGroups.map(group => { const GroupIcon = group.icon; const active = group.items.some(item => item.id === currentView); const expanded = !!openGroups[group.id] || active; return <div key={group.id}><button onClick={() => setOpenGroups(previous => ({ ...previous, [group.id]: !expanded }))} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold ${active ? 'text-teal-300' : 'text-slate-200 hover:bg-slate-800'}`}><GroupIcon className="h-4 w-4 text-teal-400" /><span className="flex-1 text-left">{group.label}</span><ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} /></button>{expanded && <div className="ml-4 border-l border-slate-700 pl-2">{group.items.map(item => { const Icon = item.icon; const selected = currentView === item.id; return <button key={item.id} onClick={() => goTo(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${selected ? 'bg-teal-600 font-bold text-white' : 'text-slate-300 hover:bg-slate-800'}`}><Icon className="h-4 w-4" />{item.label}</button>; })}</div>}</div>; })}
        </div>
      </div>
      <button aria-label="Fechar menu" className="flex-1" onClick={() => setIsOpen(false)} />
    </div>}
  </>;
};
