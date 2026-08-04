import React from 'react';
import { usePetGestor, AppView } from '../../context/AppContext';
import { 
  LayoutDashboard, Calendar, Scissors, ClipboardList, 
  ShoppingCart, Users, Dog, Sparkles, Package, 
  Truck, DollarSign, UserCheck, HeartHandshake, 
  FileText, BarChart3, ShieldAlert, Settings, CalendarOff, MessageCircle
} from 'lucide-react';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ElementType;
  badge?: number;
  roles?: string[];
}

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, currentProfile, company, appointments, products } = usePetGestor();

  // Badges calculation
  const pendingAppointments = appointments.filter(a => a.status === 'agendado' || a.status === 'recebido').length;
  const lowStockCount = products.filter(p => p.current_stock <= p.min_stock).length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Agenda', icon: Calendar, badge: pendingAppointments, roles: ['proprietario', 'administrador', 'gerente', 'atendente', 'caixa', 'banhista', 'tosador'] },
    { id: 'operation', label: 'Banho & Tosa', icon: Scissors, roles: ['proprietario', 'administrador', 'gerente', 'atendente', 'banhista', 'tosador'] },
    { id: 'comandas', label: 'Comandas', icon: ClipboardList },
    { id: 'pos', label: 'Frente de Caixa (PDV)', icon: ShoppingCart, roles: ['proprietario', 'administrador', 'gerente', 'caixa'] },
    { id: 'customers', label: 'Clientes & Pets', icon: Users },
    { id: 'pets', label: 'Cadastro de Pets', icon: Dog },
    { id: 'services', label: 'Serviços', icon: Sparkles, roles: ['proprietario', 'administrador', 'gerente'] },
    { id: 'products', label: 'Produtos', icon: Package, badge: lowStockCount, roles: ['proprietario', 'administrador', 'gerente', 'estoquista'] },
    { id: 'stock', label: 'Estoque & Lotes', icon: Package, roles: ['proprietario', 'administrador', 'gerente', 'estoquista'] },
    { id: 'suppliers', label: 'Fornecedores', icon: Truck, roles: ['proprietario', 'administrador', 'gerente', 'estoquista'] },
    { id: 'purchases', label: 'Pedidos de Compra', icon: Package, roles: ['proprietario','administrador','gerente','estoquista'] },
    { id: 'financial', label: 'Financeiro & Caixa', icon: DollarSign, roles: ['proprietario', 'administrador', 'gerente', 'caixa'] },
    { id: 'employees', label: 'Funcionários & Comissões', icon: UserCheck, roles: ['proprietario', 'administrador'] },
    { id: 'delivery', label: 'Busca & Entrega (Táxi)', icon: Truck, roles: ['proprietario', 'administrador', 'gerente', 'atendente'] },
    { id: 'loyalty', label: 'Fidelidade & Pacotes', icon: HeartHandshake, roles: ['proprietario', 'administrador', 'gerente', 'atendente', 'caixa'] },
    { id: 'consent', label: 'Termos & Incidentes', icon: FileText },
    { id: 'communications', label: 'Comunicação & WhatsApp', icon: MessageCircle, roles: ['proprietario','administrador','gerente','atendente'] },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, roles: ['proprietario', 'administrador', 'gerente'] },
    { id: 'audit', label: 'Auditoria', icon: ShieldAlert, roles: ['proprietario', 'administrador'] },
    { id: 'availability', label: 'Bloqueios da Agenda', icon: CalendarOff, roles: ['proprietario', 'administrador', 'gerente', 'atendente'] },
    { id: 'settings', label: 'Configurações', icon: Settings, roles: ['proprietario', 'administrador'] },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 shrink-0 select-none transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-xs shrink-0">
          <Dog className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-teal-800 dark:text-teal-400 truncate">
            {company.trade_name || company.name || 'PetGestor'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
            Gestão Integrada
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {navItems.filter(item => !item.roles || item.roles.includes(currentProfile.role)).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group ${
                isActive
                  ? 'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
              }`} />
              <span className="flex-1 text-left truncate">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  isActive ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Badge */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700/50">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
            {currentProfile.full_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate">
              {currentProfile.full_name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate">
              {currentProfile.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
