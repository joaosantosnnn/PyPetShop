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

const MainLayout: React.FC = () => {
  const { currentView } = usePetGestor();

  const renderView = () => {
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
      case 'suppliers':
        return <InventoryView />;
      case 'stock':
        return <StockManagementView />;
      case 'purchases':
        return <PurchasesView />;
      case 'financial':
        return <FinancialView />;
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
          {renderView()}
        </main>
      </div>
      <MobileNav />
      <ToastContainer />
      <ConfirmationModal />
    </div>
  );
};

export default function App() {
  if (window.location.pathname.startsWith('/portal')) return <><CustomerPortal /><PortalPixWidget /><PortalReceiptsWidget /><PortalAppointmentActions /></>;
  return (
    <AppProvider>
      <AuthGate>
        <MainLayout />
      </AuthGate>
    </AppProvider>
  );
}
