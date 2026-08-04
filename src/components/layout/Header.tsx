import React from 'react';
import { usePetGestor } from '../../context/AppContext';
import { 
  Sun, Moon, Calendar, ShoppingCart, 
  UserPlus, DollarSign, Database, LogOut
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

interface HeaderProps {
  onOpenNewAppointment?: () => void;
  onOpenNewSale?: () => void;
  onOpenNewCustomer?: () => void;
  onOpenNewExpense?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewAppointment = () => undefined,
  onOpenNewSale = () => undefined,
  onOpenNewCustomer = () => undefined,
  onOpenNewExpense = () => undefined,
}) => {
  const { theme, toggleTheme, currentProfile, currentView } = usePetGestor();

  const viewTitles: Record<string, string> = {
    dashboard: 'Painel Principal',
    appointments: 'Agenda de Banho & Tosa',
    operation: 'Painel Operacional (Kanban)',
    comandas: 'Gestão de Comandas',
    pos: 'Frente de Caixa (PDV)',
    customers: 'Cadastro de Clientes',
    pets: 'Cadastro de Pets',
    services: 'Catálogo de Serviços',
    products: 'Catálogo de Produtos',
    stock: 'Controle de Estoque & Lotes',
    suppliers: 'Fornecedores & Compras',
    financial: 'Controle Financeiro & Caixa',
    employees: 'Funcionários & Comissões',
    delivery: 'Busca & Entrega (Táxi Dog)',
    loyalty: 'Fidelidade & Pacotes',
    consent: 'Termos & Incidentes',
    reports: 'Relatórios & Inteligência',
    audit: 'Logs de Auditoria',
    settings: 'Configurações do Sistema',
  };

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 transition-colors duration-200">
      {/* Title / Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight truncate">
          {viewTitles[currentView] || 'PetGestor'}
        </h2>

        <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0"></div>

        <span className="hidden sm:inline text-xs sm:text-sm text-slate-400 dark:text-slate-500 capitalize shrink-0">
          {todayFormatted}
        </span>

        {/* Database Mode Badge */}
        <span className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isSupabaseConfigured 
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
        }`}>
          <Database className="w-3 h-3" />
          {isSupabaseConfigured ? 'Supabase Conectado' : 'Modo Operacional'}
        </span>
      </div>

      {/* Quick Action Shortcuts & Utilities */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Action Buttons */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
          <button
            onClick={onOpenNewAppointment}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs transition"
            title="Novo Agendamento"
          >
            <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Agenda</span>
          </button>
          <button
            onClick={onOpenNewSale}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs transition"
            title="Nova Venda PDV"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>PDV</span>
          </button>
          <button
            onClick={onOpenNewCustomer}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs transition"
            title="Novo Cliente"
          >
            <UserPlus className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Cliente</span>
          </button>
          <button
            onClick={onOpenNewExpense}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs transition"
            title="Nova Despesa"
          >
            <DollarSign className="w-3.5 h-3.5 text-rose-500" />
            <span>Despesa</span>
          </button>
        </div>

        <span className="hidden sm:inline text-xs font-semibold capitalize text-slate-500">{currentProfile.role}</span>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={`Mudar para tema ${theme === 'light' ? 'Escuro' : 'Claro'}`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>
        <button onClick={() => supabase.auth.signOut()} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition" title="Sair"><LogOut className="w-4 h-4" /></button>
      </div>
    </header>
  );
};
