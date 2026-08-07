import React from 'react';
import { AppProvider, usePetGestor } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { AuthGate } from './components/auth/AuthGate';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { CustomersView } from './components/customers/CustomersView';
import { PetsView } from './components/pets/PetsView';
import { ServicesView } from './components/services/ServicesView';
import { AppointmentsView } from './components/appointments/AppointmentsView';
import { KanbanBoard } from './components/operation/KanbanBoard';
import { ComandasView } from './components/comandas/ComandasView';
import { POSView } from './components/pos/POSView';
import { InventoryView } from './components/inventory/InventoryView';
import { SuppliersView } from './components/inventory/SuppliersView';
import { StockManagementView } from './components/inventory/StockManagementView';
import { FinancialView } from './components/financial/FinancialView';
import { EmployeesView } from './components/employees/EmployeesView';
import { DeliveryView } from './components/delivery/DeliveryView';
import { LoyaltyView } from './components/loyalty/LoyaltyView';
import { TermsView } from './components/terms/TermsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { AvailabilityView } from './components/settings/AvailabilityView';
import { AuditView } from './components/audit/AuditView';
import { CommunicationsView } from './components/communications/CommunicationsView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { DataManagementView } from './components/settings/DataManagementView';
import { CustomerPortal } from './components/portal/CustomerPortal';
import { PortalPixWidget } from './components/portal/PortalPixWidget';
import { PortalReceiptsWidget } from './components/portal/PortalReceiptsWidget';
import { PortalAppointmentActions } from './components/portal/PortalAppointmentActions';
import { PortalCreditsWidget } from './components/portal/PortalCreditsWidget';
import { canAccessView } from './utils/permissions';
import { ViewErrorBoundary } from './components/common/ViewErrorBoundary';

const MainLayout: React.FC = () => {
  const { currentView } = usePetGestor();
  const { currentProfile,setCurrentView } = usePetGestor();

  const renderView = () => {
    if(!canAccessView(currentProfile.role,currentView))return <div className="p-6"><div className="max-w-lg mx-auto mt-16 bg-white dark:bg-slate-900 border rounded-2xl p-6 text-center"><h2 className="font-bold text-lg">Acesso restrito</h2><p className="text-sm text-slate-500 my-3">Seu cargo nao possui permissao para acessar esta area.</p><button onClick={()=>setCurrentView('dashboard')} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold">Voltar ao painel</button></div></div>;
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'customers':
        return <CustomersView />;
      case 'pets':
        return <PetsView />;
      case 'services':
        return <ServicesView />;
      case 'appointments':
        return <AppointmentsView />;
      case 'operation':
        return <KanbanBoard />;
      case 'comandas':
        return <ComandasView />;
      case 'pos':
        return <POSView />;
      case 'products':
        return <InventoryView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'stock':
        return <StockManagementView />;
      case 'purchases':
        return <PurchasesView />;
      case 'financial':
      case 'financial-entries':
        return <FinancialView initialTab="movements" initialMovementKind="in" />;
      case 'financial-expenses':
        return <FinancialView initialTab="movements" initialMovementKind="out" />;
      case 'cash-flow':
        return <FinancialView initialTab="cashflow" />;
      case 'financial-settings':
        return <FinancialView initialTab="settings" />;
      case 'employees':
        return <EmployeesView />;
      case 'delivery':
        return <DeliveryView />;
      case 'loyalty':
        return <LoyaltyView />;
      case 'consent':
        return <TermsView />;
      case 'communications':
        return <CommunicationsView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      case 'data-management':
        return <DataManagementView />;
      case 'availability':
        return <AvailabilityView />;
      case 'audit':
        return <AuditView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 custom-scrollbar">
          <ViewErrorBoundary viewKey={currentView} onBack={() => setCurrentView('dashboard')}>
            <React.Fragment key={currentView}>{renderView()}</React.Fragment>
          </ViewErrorBoundary>
        </main>
      </div>
      <MobileNav />
      <ToastContainer />
      <ConfirmationModal />
    </div>
  );
};

export default function App() {
  if (window.location.pathname.startsWith('/portal')) return <><CustomerPortal /><PortalPixWidget /><PortalReceiptsWidget /><PortalAppointmentActions /><PortalCreditsWidget /></>;
  return (
    <AppProvider>
      <AuthGate>
        <MainLayout />
      </AuthGate>
    </AppProvider>
  );
}
