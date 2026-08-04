import React, { useState } from 'react';
import { usePetGestor, AppView } from '../../context/AppContext';
import { 
  LayoutDashboard, Calendar, Scissors, ShoppingCart, 
  Menu, X, Dog, Users, Sparkles, Package, DollarSign, 
  Truck, Settings, FileText, BarChart3, UserCheck, HeartHandshake, ClipboardList, ShieldAlert
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { currentView, setCurrentView, company } = usePetGestor();
  const [isOpen, setIsOpen] = useState(false);

  const mainTabs: { id: AppView; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'appointments', label: 'Agenda', icon: Calendar },
    { id: 'operation', label: 'Banho', icon: Scissors },
    { id: 'pos', label: 'PDV', icon: ShoppingCart },
  ];

  const allDrawerItems: { id: AppView; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard Principal', icon: LayoutDashboard },
    { id: 'appointments', label: 'Agenda de Banho & Tosa', icon: Calendar },
    { id: 'operation', label: 'Painel Operacional (Kanban)', icon: Scissors },
    { id: 'comandas', label: 'Gestão de Comandas', icon: ClipboardList },
    { id: 'pos', label: 'Frente de Caixa (PDV)', icon: ShoppingCart },
    { id: 'customers', label: 'Clientes (Tutores)', icon: Users },
    { id: 'pets', label: 'Pets (Animais)', icon: Dog },
    { id: 'services', label: 'Serviços', icon: Sparkles },
    { id: 'products', label: 'Produtos & Preços', icon: Package },
    { id: 'stock', label: 'Estoque & Movimentações', icon: Package },
    { id: 'suppliers', label: 'Fornecedores & Pedidos', icon: Truck },
    { id: 'financial', label: 'Financeiro & Caixa', icon: DollarSign },
    { id: 'employees', label: 'Equipe & Comissões', icon: UserCheck },
    { id: 'delivery', label: 'Busca & Entrega (Táxi)', icon: Truck },
    { id: 'loyalty', label: 'Fidelidade & Pacotes', icon: HeartHandshake },
    { id: 'consent', label: 'Termos & Incidentes', icon: FileText },
    { id: 'reports', label: 'Relatórios Operacionais', icon: BarChart3 },
    { id: 'audit', label: 'Logs de Auditoria', icon: ShieldAlert },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* Bottom Bar Navigation for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around z-40 px-2 shadow-lg">
        {mainTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition ${
                isActive 
                  ? 'text-teal-600 dark:text-teal-400 font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center justify-center w-16 py-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-teal-600"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </nav>

      {/* Slide-over Drawer Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-sm lg:hidden">
          <div className="w-4/5 max-w-xs bg-slate-900 text-white h-full flex flex-col p-4 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Dog className="w-6 h-6 text-teal-400" />
                <span className="font-bold text-lg">{company.name || 'PetGestor'}</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-1">
              {allDrawerItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-teal-400" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1" onClick={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
};
