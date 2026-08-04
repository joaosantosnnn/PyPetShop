import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Company, UserProfile, Customer, Pet, Service, 
  Appointment, ServiceOrder, Product, StockMovement, 
  Sale, FinancialTransaction, Supplier, CashRegister, 
  DeliveryRequest, ConsentTerm, AuditLog, AppointmentStatus, ServiceOrderStatus 
} from '../types';
import { 
  initialCompany, initialProfiles, initialCustomers, 
  initialPets, initialServices, initialAppointments, 
  initialProducts, initialSales, initialFinancialTransactions, 
  initialCashRegister, initialSuppliers, initialDeliveryRequests, 
  initialConsentTerms, initialAuditLogs 
} from '../data/initialData';
import { generateId, formatBRL } from '../utils/formatters';

export type AppView = 
  | 'dashboard'
  | 'customers'
  | 'pets'
  | 'services'
  | 'appointments'
  | 'operation' // Kanban Banho e Tosa
  | 'comandas' // Service Orders
  | 'pos' // Frente de Caixa
  | 'products'
  | 'stock'
  | 'suppliers'
  | 'financial'
  | 'employees'
  | 'delivery'
  | 'loyalty'
  | 'consent'
  | 'reports'
  | 'audit'
  | 'settings';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface AppContextType {
  // Navigation & Theme
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Auth & Profile
  currentProfile: UserProfile;
  setCurrentProfile: (profile: UserProfile) => void;
  allProfiles: UserProfile[];
  company: Company;
  updateCompany: (company: Company) => void;
  
  // Collections
  customers: Customer[];
  pets: Pet[];
  services: Service[];
  appointments: Appointment[];
  serviceOrders: ServiceOrder[];
  products: Product[];
  stockMovements: StockMovement[];
  sales: Sale[];
  financialTransactions: FinancialTransaction[];
  cashRegister: CashRegister;
  suppliers: Supplier[];
  deliveryRequests: DeliveryRequest[];
  consentTerms: ConsentTerm[];
  auditLogs: AuditLog[];
  
  // Actions - Customers
  addCustomer: (customer: Omit<Customer, 'id' | 'company_id' | 'total_spent' | 'outstanding_balance'>) => Customer;
  updateCustomer: (customer: Customer) => void;
  toggleCustomerActive: (id: string) => void;
  
  // Actions - Pets
  addPet: (pet: Omit<Pet, 'id' | 'company_id'>) => Pet;
  updatePet: (pet: Pet) => void;
  
  // Actions - Services
  addService: (service: Omit<Service, 'id' | 'company_id'>) => Service;
  updateService: (service: Service) => void;
  
  // Actions - Appointments & Operational Kanban
  addAppointment: (appointment: Omit<Appointment, 'id' | 'company_id'>) => Appointment;
  updateAppointmentStatus: (id: string, status: AppointmentStatus, reason?: string) => void;
  updateAppointment: (appointment: Appointment) => void;
  
  // Actions - Service Orders (Comandas)
  addServiceOrder: (so: Omit<ServiceOrder, 'id' | 'company_id' | 'order_number'>) => ServiceOrder;
  updateServiceOrder: (so: ServiceOrder) => void;
  finalizeServiceOrder: (id: string, paymentMethod: string, paidAmount: number) => void;
  
  // Actions - Products & Stock
  addProduct: (product: Omit<Product, 'id' | 'company_id'>) => Product;
  updateProduct: (product: Product) => void;
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'company_id' | 'created_at'>) => void;
  
  // Actions - Sales / POS
  completeSale: (saleData: Omit<Sale, 'id' | 'company_id' | 'sale_number' | 'created_at'>) => Sale;
  cancelSale: (saleId: string, reason: string) => void;
  
  // Actions - Financial & Cash Register
  addFinancialTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'company_id' | 'created_at'>) => void;
  updateTransactionStatus: (id: string, status: 'pago' | 'pendente' | 'cancelado', paymentDate?: string) => void;
  updateCashRegister: (data: Partial<CashRegister>) => void;
  registerCashMovement: (type: 'sangria' | 'suprimento', amount: number, description: string) => void;
  
  // Actions - Suppliers & Delivery
  addSupplier: (supplier: Omit<Supplier, 'id' | 'company_id'>) => void;
  addDeliveryRequest: (req: Omit<DeliveryRequest, 'id' | 'company_id'>) => void;
  updateDeliveryStatus: (id: string, status: DeliveryRequest['status']) => void;
  
  // Toasts
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  
  // Audit Logger
  logAudit: (action: string, entity_type: string, entity_id?: string, details?: string) => void;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Theme
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('petgestor_theme') as 'light' | 'dark') || 'light';
  });

  // State initialization with localStorage fallback
  const [company, setCompany] = useState<Company>(() => {
    const saved = localStorage.getItem('petgestor_company');
    return saved ? JSON.parse(saved) : initialCompany;
  });

  const [allProfiles] = useState<UserProfile[]>(initialProfiles);
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('petgestor_profile');
    return saved ? JSON.parse(saved) : initialProfiles[0];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('petgestor_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [pets, setPets] = useState<Pet[]>(() => {
    const saved = localStorage.getItem('petgestor_pets');
    return saved ? JSON.parse(saved) : initialPets;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('petgestor_services');
    return saved ? JSON.parse(saved) : initialServices;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('petgestor_appointments');
    return saved ? JSON.parse(saved) : initialAppointments;
  });

  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(() => {
    const saved = localStorage.getItem('petgestor_service_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('petgestor_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('petgestor_stock_movements');
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('petgestor_sales');
    return saved ? JSON.parse(saved) : initialSales;
  });

  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>(() => {
    const saved = localStorage.getItem('petgestor_financials');
    return saved ? JSON.parse(saved) : initialFinancialTransactions;
  });

  const [cashRegister, setCashRegister] = useState<CashRegister>(() => {
    const saved = localStorage.getItem('petgestor_cash');
    return saved ? JSON.parse(saved) : initialCashRegister;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('petgestor_suppliers');
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryRequest[]>(() => {
    const saved = localStorage.getItem('petgestor_delivery');
    return saved ? JSON.parse(saved) : initialDeliveryRequests;
  });

  const [consentTerms] = useState<ConsentTerm[]>(initialConsentTerms);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('petgestor_audit');
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // LocalStorage Persist Effects
  useEffect(() => {
    localStorage.setItem('petgestor_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => { localStorage.setItem('petgestor_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('petgestor_pets', JSON.stringify(pets)); }, [pets]);
  useEffect(() => { localStorage.setItem('petgestor_services', JSON.stringify(services)); }, [services]);
  useEffect(() => { localStorage.setItem('petgestor_appointments', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem('petgestor_service_orders', JSON.stringify(serviceOrders)); }, [serviceOrders]);
  useEffect(() => { localStorage.setItem('petgestor_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('petgestor_sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('petgestor_financials', JSON.stringify(financialTransactions)); }, [financialTransactions]);
  useEffect(() => { localStorage.setItem('petgestor_cash', JSON.stringify(cashRegister)); }, [cashRegister]);
  useEffect(() => { localStorage.setItem('petgestor_audit', JSON.stringify(auditLogs)); }, [auditLogs]);

  // Theme Toggle
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Toasts
  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Audit Log
  const logAudit = (action: string, entity_type: string, entity_id?: string, details?: string) => {
    const newLog: AuditLog = {
      id: generateId(),
      company_id: company.id,
      user_name: currentProfile.full_name,
      action,
      entity_type,
      entity_id,
      details: details || '',
      created_at: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Company Update
  const updateCompany = (newCompany: Company) => {
    setCompany(newCompany);
    localStorage.setItem('petgestor_company', JSON.stringify(newCompany));
    addToast('Dados da empresa atualizados!', 'success');
    logAudit('Atualização de Empresa', 'Empresa', newCompany.id, newCompany.name);
  };

  // Customers CRUD
  const addCustomer = (data: Omit<Customer, 'id' | 'company_id' | 'total_spent' | 'outstanding_balance'>) => {
    const newCust: Customer = {
      ...data,
      id: generateId(),
      company_id: company.id,
      total_spent: 0,
      outstanding_balance: 0,
      created_at: new Date().toISOString(),
    };
    setCustomers(prev => [newCust, ...prev]);
    addToast(`Cliente ${newCust.name} cadastrado(a) com sucesso!`, 'success');
    logAudit('Novo Cliente', 'Cliente', newCust.id, newCust.name);
    return newCust;
  };

  const updateCustomer = (updated: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    addToast(`Cliente ${updated.name} atualizado(a)!`, 'success');
    logAudit('Edição de Cliente', 'Cliente', updated.id, updated.name);
  };

  const toggleCustomerActive = (id: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === id) {
        const nextState = !c.is_active;
        addToast(`Cliente ${c.name} ${nextState ? 'ativado(a)' : 'inativado(a)'}`, 'info');
        logAudit('Inativação/Ativação de Cliente', 'Cliente', c.id, `Status: ${nextState}`);
        return { ...c, is_active: nextState };
      }
      return c;
    }));
  };

  // Pets CRUD
  const addPet = (data: Omit<Pet, 'id' | 'company_id'>) => {
    const newPet: Pet = {
      ...data,
      id: generateId(),
      company_id: company.id,
      created_at: new Date().toISOString(),
    };
    setPets(prev => [newPet, ...prev]);
    addToast(`Pet ${newPet.name} cadastrado(a)!`, 'success');
    logAudit('Novo Pet', 'Pet', newPet.id, `${newPet.name} (${newPet.species})`);
    return newPet;
  };

  const updatePet = (updated: Pet) => {
    setPets(prev => prev.map(p => p.id === updated.id ? updated : p));
    addToast(`Dados do pet ${updated.name} atualizados!`, 'success');
    logAudit('Edição de Pet', 'Pet', updated.id, updated.name);
  };

  // Services CRUD
  const addService = (data: Omit<Service, 'id' | 'company_id'>) => {
    const newSrv: Service = {
      ...data,
      id: generateId(),
      company_id: company.id,
    };
    setServices(prev => [...prev, newSrv]);
    addToast(`Serviço ${newSrv.name} adicionado!`, 'success');
    logAudit('Novo Serviço', 'Serviço', newSrv.id, newSrv.name);
    return newSrv;
  };

  const updateService = (updated: Service) => {
    setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
    addToast(`Serviço ${updated.name} atualizado!`, 'success');
    logAudit('Edição de Serviço', 'Serviço', updated.id, updated.name);
  };

  // Appointments & Operational Kanban
  const addAppointment = (data: Omit<Appointment, 'id' | 'company_id'>) => {
    // Check conflicts for same employee at same time
    const conflict = appointments.find(a => 
      a.employee_id === data.employee_id && 
      a.status !== 'cancelado' && 
      a.status !== 'entregue' &&
      Math.abs(new Date(a.scheduled_at).getTime() - new Date(data.scheduled_at).getTime()) < (data.estimated_duration_minutes * 60000)
    );

    if (conflict) {
      addToast(`Atenção: Já existe outro agendamento (${conflict.pet_name}) neste horário com este profissional!`, 'warning');
    }

    const newApp: Appointment = {
      ...data,
      id: generateId(),
      company_id: company.id,
      created_at: new Date().toISOString(),
    };

    setAppointments(prev => [newApp, ...prev]);
    addToast(`Agendamento criado para ${newApp.pet_name}!`, 'success');
    logAudit('Novo Agendamento', 'Agendamento', newApp.id, `${newApp.pet_name} - ${newApp.scheduled_at}`);
    return newApp;
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus, reason?: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { 
          ...a, 
          status, 
          cancellation_reason: reason || a.cancellation_reason 
        };
        addToast(`Agendamento de ${a.pet_name} alterado para "${status.replace('_', ' ').toUpperCase()}"`, 'info');
        logAudit('Status de Agendamento', 'Agendamento', id, `De ${a.status} para ${status}`);
        return updated;
      }
      return a;
    }));
  };

  const updateAppointment = (updated: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
    addToast(`Agendamento de ${updated.pet_name} atualizado!`, 'success');
    logAudit('Edição de Agendamento', 'Agendamento', updated.id, updated.pet_name);
  };

  // Service Orders (Comandas)
  const addServiceOrder = (data: Omit<ServiceOrder, 'id' | 'company_id' | 'order_number'>) => {
    const order_number = serviceOrders.length + 1001;
    const newSO: ServiceOrder = {
      ...data,
      id: generateId(),
      company_id: company.id,
      order_number,
      created_at: new Date().toISOString(),
    };
    setServiceOrders(prev => [newSO, ...prev]);
    addToast(`Comanda #${order_number} gerada para ${newSO.pet_name}!`, 'success');
    logAudit('Abertura de Comanda', 'Comanda', newSO.id, `Comanda #${order_number}`);
    return newSO;
  };

  const updateServiceOrder = (updated: ServiceOrder) => {
    setServiceOrders(prev => prev.map(so => so.id === updated.id ? updated : so));
    addToast(`Comanda #${updated.order_number} atualizada!`, 'info');
  };

  const finalizeServiceOrder = (id: string, paymentMethod: string, paidAmount: number) => {
    const so = serviceOrders.find(s => s.id === id);
    if (!so) return;

    const updatedSO: ServiceOrder = {
      ...so,
      status: 'paga',
      paid_amount: paidAmount,
    };

    setServiceOrders(prev => prev.map(s => s.id === id ? updatedSO : s));

    // Register financial transaction
    addFinancialTransaction({
      type: 'receita',
      category: 'Serviços',
      description: `Comanda #${so.order_number} - ${so.pet_name}`,
      amount: paidAmount,
      due_date: new Date().toISOString().split('T')[0],
      payment_date: new Date().toISOString().split('T')[0],
      status: 'pago',
      payment_method: paymentMethod as any,
      customer_id: so.customer_id,
      customer_name: so.customer_name,
    });

    // Update customer total spent
    if (so.customer_id) {
      setCustomers(prev => prev.map(c => {
        if (c.id === so.customer_id) {
          return { ...c, total_spent: c.total_spent + paidAmount };
        }
        return c;
      }));
    }

    addToast(`Comanda #${so.order_number} finalizada e receita registrada!`, 'success');
    logAudit('Comanda Finalizada', 'Comanda', id, `Valor: ${formatBRL(paidAmount)}`);
  };

  // Products & Stock
  const addProduct = (data: Omit<Product, 'id' | 'company_id'>) => {
    const newProd: Product = {
      ...data,
      id: generateId(),
      company_id: company.id,
      created_at: new Date().toISOString(),
    };
    setProducts(prev => [newProd, ...prev]);
    addToast(`Produto ${newProd.name} cadastrado!`, 'success');
    logAudit('Novo Produto', 'Produto', newProd.id, newProd.name);
    return newProd;
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    addToast(`Produto ${updated.name} atualizado!`, 'success');
    logAudit('Edição de Produto', 'Produto', updated.id, updated.name);
  };

  const addStockMovement = (data: Omit<StockMovement, 'id' | 'company_id' | 'created_at'>) => {
    const product = products.find(p => p.id === data.product_id);
    if (!product) return;

    let qtyChange = data.quantity;
    if (['venda', 'consumo_servico', 'perda', 'avaria', 'vencimento', 'ajuste_negativo'].includes(data.movement_type)) {
      qtyChange = -Math.abs(data.quantity);
    } else {
      qtyChange = Math.abs(data.quantity);
    }

    const previous_stock = product.current_stock;
    const new_stock = Math.max(0, previous_stock + qtyChange);

    // Update product stock level
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, current_stock: new_stock } : p));

    const newMov: StockMovement = {
      ...data,
      id: generateId(),
      company_id: company.id,
      previous_stock,
      new_stock,
      created_by_name: currentProfile.full_name,
      created_at: new Date().toISOString(),
    };

    setStockMovements(prev => [newMov, ...prev]);
    addToast(`Estoque de ${product.name} ajustado para ${new_stock} ${product.unit}`, 'info');
    logAudit('Movimentação de Estoque', 'Estoque', product.id, `Tipo: ${data.movement_type} | Qtd: ${qtyChange}`);
  };

  // Sales / POS
  const completeSale = (data: Omit<Sale, 'id' | 'company_id' | 'sale_number' | 'created_at'>) => {
    const sale_number = sales.length + 1001;
    const newSale: Sale = {
      ...data,
      id: generateId(),
      company_id: company.id,
      sale_number,
      created_at: new Date().toISOString(),
    };

    setSales(prev => [newSale, ...prev]);

    // Decrease stock for each item sold
    data.items.forEach(item => {
      addStockMovement({
        product_id: item.product.id,
        product_name: item.product.name,
        movement_type: 'venda',
        quantity: item.quantity,
        unit_cost: item.product.cost_price,
        previous_stock: item.product.current_stock,
        new_stock: item.product.current_stock - item.quantity,
        reason: `Venda PDV #${sale_number}`,
      });
    });

    // Add financial revenue
    addFinancialTransaction({
      type: 'receita',
      category: 'Venda de produtos',
      description: `Venda PDV #${sale_number}`,
      amount: newSale.total,
      due_date: new Date().toISOString().split('T')[0],
      payment_date: new Date().toISOString().split('T')[0],
      status: 'pago',
      payment_method: newSale.payment_method,
      customer_id: newSale.customer_id,
      customer_name: newSale.customer_name,
    });

    // Update customer metrics
    if (newSale.customer_id) {
      setCustomers(prev => prev.map(c => c.id === newSale.customer_id ? { ...c, total_spent: c.total_spent + newSale.total } : c));
    }

    addToast(`Venda #${sale_number} concluída com sucesso! Total: ${formatBRL(newSale.total)}`, 'success');
    logAudit('Venda Realizada', 'Venda', newSale.id, `Venda #${sale_number} | Valor: ${formatBRL(newSale.total)}`);
    return newSale;
  };

  const cancelSale = (saleId: string, reason: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: 'cancelada', notes: `Cancelada: ${reason}` } : s));

    // Restore stock
    sale.items.forEach(item => {
      addStockMovement({
        product_id: item.product.id,
        product_name: item.product.name,
        movement_type: 'devolucao',
        quantity: item.quantity,
        unit_cost: item.product.cost_price,
        previous_stock: item.product.current_stock,
        new_stock: item.product.current_stock + item.quantity,
        reason: `Cancelamento da Venda #${sale.sale_number}: ${reason}`,
      });
    });

    addToast(`Venda #${sale.sale_number} cancelada e estoque reposto!`, 'warning');
    logAudit('Cancelamento de Venda', 'Venda', saleId, `Motivo: ${reason}`);
  };

  // Financial & Cash Register
  const addFinancialTransaction = (data: Omit<FinancialTransaction, 'id' | 'company_id' | 'created_at'>) => {
    const newTrans: FinancialTransaction = {
      ...data,
      id: generateId(),
      company_id: company.id,
      created_at: new Date().toISOString(),
    };
    setFinancialTransactions(prev => [newTrans, ...prev]);
    logAudit('Transação Financeira', 'Financeiro', newTrans.id, `${newTrans.type.toUpperCase()}: ${newTrans.description}`);
  };

  const updateTransactionStatus = (id: string, status: 'pago' | 'pendente' | 'cancelado', paymentDate?: string) => {
    setFinancialTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          status, 
          payment_date: paymentDate || (status === 'pago' ? new Date().toISOString().split('T')[0] : t.payment_date) 
        };
      }
      return t;
    }));
    addToast('Status da conta atualizado!', 'info');
  };

  const updateCashRegister = (data: Partial<CashRegister>) => {
    setCashRegister(prev => ({ ...prev, ...data }));
    addToast('Caixa atualizado!', 'info');
  };

  const registerCashMovement = (type: 'sangria' | 'suprimento', amount: number, description: string) => {
    if (type === 'sangria') {
      setCashRegister(prev => ({
        ...prev,
        total_withdrawals: prev.total_withdrawals + amount,
      }));
      addFinancialTransaction({
        type: 'sangria',
        category: 'Sangria de Caixa',
        description: `Sangria: ${description}`,
        amount,
        due_date: new Date().toISOString().split('T')[0],
        payment_date: new Date().toISOString().split('T')[0],
        status: 'pago',
      });
      addToast(`Sangria de ${formatBRL(amount)} realizada!`, 'warning');
    } else {
      setCashRegister(prev => ({
        ...prev,
        total_supplements: prev.total_supplements + amount,
      }));
      addFinancialTransaction({
        type: 'suprimento',
        category: 'Suprimento de Caixa',
        description: `Suprimento: ${description}`,
        amount,
        due_date: new Date().toISOString().split('T')[0],
        payment_date: new Date().toISOString().split('T')[0],
        status: 'pago',
      });
      addToast(`Suprimento de ${formatBRL(amount)} adicionado!`, 'success');
    }
  };

  // Suppliers & Delivery
  const addSupplier = (data: Omit<Supplier, 'id' | 'company_id'>) => {
    const newSupp: Supplier = {
      ...data,
      id: generateId(),
      company_id: company.id,
    };
    setSuppliers(prev => [...prev, newSupp]);
    addToast(`Fornecedor ${newSupp.trade_name || newSupp.company_name} cadastrado!`, 'success');
  };

  const addDeliveryRequest = (data: Omit<DeliveryRequest, 'id' | 'company_id'>) => {
    const newReq: DeliveryRequest = {
      ...data,
      id: generateId(),
      company_id: company.id,
    };
    setDeliveryRequests(prev => [newReq, ...prev]);
    addToast(`Solicitação de Táxi Dog agendada para ${newReq.pet_name}!`, 'success');
  };

  const updateDeliveryStatus = (id: string, status: DeliveryRequest['status']) => {
    setDeliveryRequests(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    addToast(`Status do transporte atualizado para "${status.toUpperCase()}"`, 'info');
  };

  // Reset Demo Data
  const resetDemoData = () => {
    localStorage.clear();
    setCompany(initialCompany);
    setCurrentProfile(initialProfiles[0]);
    setCustomers(initialCustomers);
    setPets(initialPets);
    setServices(initialServices);
    setAppointments(initialAppointments);
    setServiceOrders([]);
    setProducts(initialProducts);
    setSales(initialSales);
    setFinancialTransactions(initialFinancialTransactions);
    setCashRegister(initialCashRegister);
    setSuppliers(initialSuppliers);
    setDeliveryRequests(initialDeliveryRequests);
    setAuditLogs(initialAuditLogs);
    addToast('Dados demonstrativos restaurados com sucesso!', 'success');
  };

  return (
    <AppContext.Provider value={{
      currentView, setCurrentView,
      theme, toggleTheme,
      currentProfile, setCurrentProfile, allProfiles,
      company, updateCompany,
      customers, pets, services, appointments, serviceOrders,
      products, stockMovements, sales, financialTransactions, cashRegister,
      suppliers, deliveryRequests, consentTerms, auditLogs,
      addCustomer, updateCustomer, toggleCustomerActive,
      addPet, updatePet,
      addService, updateService,
      addAppointment, updateAppointmentStatus, updateAppointment,
      addServiceOrder, updateServiceOrder, finalizeServiceOrder,
      addProduct, updateProduct, addStockMovement,
      completeSale, cancelSale,
      addFinancialTransaction, updateTransactionStatus, updateCashRegister, registerCashMovement,
      addSupplier, addDeliveryRequest, updateDeliveryStatus,
      toasts, addToast, removeToast, logAudit, resetDemoData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const usePetGestor = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('usePetGestor deve ser usado dentro de um AppProvider');
  return context;
};
