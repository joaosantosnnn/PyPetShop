import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Company, UserProfile, Customer, Pet, Service, 
  Appointment, ServiceOrder, Product, StockMovement, 
  Sale, FinancialTransaction, Supplier, CashRegister, 
  DeliveryRequest, ConsentTerm, AppointmentStatus, ServiceOrderStatus 
} from '../types';
import { 
  initialCompany, initialProfiles,
  initialCashRegister, initialDeliveryRequests,
  initialConsentTerms
} from '../data/initialData';
import { generateId, formatBRL } from '../utils/formatters';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  insertAppointment, insertCustomer, insertPet, insertService, loadOperationalData,
  saveAppointment, saveCompany, saveCustomer, savePet, saveService,
} from '../services/petshopRepository';
import {
  adjustProductStock, completeProductSale, insertProduct, insertSupplier,
  loadCommercialData, saveProduct, type SaleInput,
} from '../services/commercialRepository';
import {
  addOrderItem, insertFinancialTransaction, loadServiceOrders, openServiceOrder, payServiceOrder,
} from '../services/serviceOrderRepository';
import { closeCash, loadOpenCash, moveCash, openCash } from '../services/cashRepository';
import { insertDeliveryRequest, loadDeliveryRequests, saveDeliveryRequest } from '../services/deliveryRepository';

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
  | 'availability'
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
  addServiceOrder: (so: Omit<ServiceOrder, 'id' | 'company_id' | 'order_number'>) => Promise<void>;
  addServiceOrderItem: (orderId: string, type: 'service' | 'product' | 'internal_consumption', itemId: string, quantity: number) => Promise<void>;
  updateServiceOrder: (so: ServiceOrder) => void;
  finalizeServiceOrder: (id: string, paymentMethod: string, paidAmount: number) => Promise<void>;
  
  // Actions - Products & Stock
  addProduct: (product: Omit<Product, 'id' | 'company_id'>) => Product;
  updateProduct: (product: Product) => void;
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'company_id' | 'created_at'>) => void;
  adjustStock: (productId: string, quantity: number, movementType: string, reason: string) => Promise<void>;
  
  // Actions - Sales / POS
  completeSale: (saleData: Omit<Sale, 'id' | 'company_id' | 'sale_number' | 'created_at'>) => Sale;
  recordSale: (saleData: SaleInput) => Promise<{ id: string; sale_number: number; subtotal: number; total_amount: number; change_amount: number; created_at: string }>;
  cancelSale: (saleId: string, reason: string) => void;
  
  // Actions - Financial & Cash Register
  addFinancialTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'company_id' | 'created_at'>) => void;
  updateTransactionStatus: (id: string, status: 'pago' | 'pendente' | 'cancelado', paymentDate?: string) => void;
  updateCashRegister: (data: Partial<CashRegister>) => void;
  openCashRegister: (initialCash: number) => Promise<void>;
  closeCashRegister: (actualCash: number) => Promise<CashRegister>;
  registerCashMovement: (type: 'sangria' | 'suprimento', amount: number, description: string) => Promise<void>;
  
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

  const [allProfiles, setAllProfiles] = useState<UserProfile[]>(initialProfiles);
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('petgestor_profile');
    return saved ? JSON.parse(saved) : initialProfiles[0];
  });

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [pets, setPets] = useState<Pet[]>([]);

  const [services, setServices] = useState<Service[]>([]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);

  const [products, setProducts] = useState<Product[]>([]);

  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  const [sales, setSales] = useState<Sale[]>([]);

  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);

  const [cashRegister, setCashRegister] = useState<CashRegister>(() => {
    const saved = localStorage.getItem('petgestor_cash');
    return saved ? JSON.parse(saved) : initialCashRegister;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryRequest[]>(initialDeliveryRequests);

  const [consentTerms] = useState<ConsentTerm[]>(initialConsentTerms);

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

  useEffect(() => {
    if (!isSupabaseConfigured || !currentProfile.company_id) return;
    let active = true;
    Promise.all([
      loadOperationalData(currentProfile.company_id),
      loadCommercialData(currentProfile.company_id),
      loadServiceOrders(currentProfile.company_id),
      loadOpenCash(currentProfile.company_id),
      loadDeliveryRequests(currentProfile.company_id),
    ]).then(([data, commercial, orders, openRegister, deliveries]) => {
        if (!active) return;
        setCompany(data.company);
        setCustomers(data.customers);
        setPets(data.pets);
        setServices(data.services);
        setAppointments(data.appointments);
        setAllProfiles(data.profiles);
        setProducts(commercial.products);
        setStockMovements(commercial.stockMovements);
        setSales(commercial.sales);
        setSuppliers(commercial.suppliers);
        setServiceOrders(orders.orders);
        setFinancialTransactions(orders.financialTransactions);
        setCashRegister(openRegister || { ...initialCashRegister, status: 'fechado' });
        setDeliveryRequests(deliveries.map(item => ({
          ...item,
          customer_name: data.customers.find(customer => customer.id === item.customer_id)?.name,
          pet_name: data.pets.find(pet => pet.id === item.pet_id)?.name,
          driver_name: data.profiles.find(profile => profile.id === item.driver_id)?.full_name,
        })));
      })
      .catch(() => {
        if (active) addToast('Não foi possível carregar os dados do PetShop.', 'error');
      });
    return () => { active = false; };
  }, [currentProfile.company_id]);
  useEffect(() => { localStorage.setItem('petgestor_cash', JSON.stringify(cashRegister)); }, [cashRegister]);

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
  const logAudit = (action: string, entityType: string, entityId?: string, details?: string) => {
    void action; void entityType; void entityId; void details;
    // A auditoria é capturada por triggers no banco, junto da alteração confirmada.
  };

  // Company Update
  const updateCompany = (newCompany: Company) => {
    const previous = company;
    setCompany(newCompany);
    localStorage.setItem('petgestor_company', JSON.stringify(newCompany));
    saveCompany(newCompany).then(saved => {
      setCompany(saved);
      localStorage.setItem('petgestor_company', JSON.stringify(saved));
      addToast('Dados da empresa atualizados!', 'success');
      logAudit('Atualização de Empresa', 'Empresa', saved.id, saved.name);
    }).catch(() => {
      setCompany(previous);
      localStorage.setItem('petgestor_company', JSON.stringify(previous));
      addToast('Não foi possível salvar as configurações.', 'error');
    });
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
    insertCustomer(newCust).catch(() => {
      setCustomers(prev => prev.filter(item => item.id !== newCust.id));
      addToast(`Não foi possível cadastrar ${newCust.name}.`, 'error');
    });
    addToast(`Cliente ${newCust.name} cadastrado(a) com sucesso!`, 'success');
    logAudit('Novo Cliente', 'Cliente', newCust.id, newCust.name);
    return newCust;
  };

  const updateCustomer = (updated: Customer) => {
    const previous = customers.find(item => item.id === updated.id);
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    saveCustomer(updated).catch(() => {
      if (previous) setCustomers(prev => prev.map(item => item.id === previous.id ? previous : item));
      addToast(`Não foi possível atualizar ${updated.name}.`, 'error');
    });
    addToast(`Cliente ${updated.name} atualizado(a)!`, 'success');
    logAudit('Edição de Cliente', 'Cliente', updated.id, updated.name);
  };

  const toggleCustomerActive = (id: string) => {
    const current = customers.find(item => item.id === id);
    if (!current) return;
    const updated = { ...current, is_active: !current.is_active };
    setCustomers(prev => prev.map(c => {
      if (c.id === id) {
        const nextState = updated.is_active;
        addToast(`Cliente ${c.name} ${nextState ? 'ativado(a)' : 'inativado(a)'}`, 'info');
        logAudit('Inativação/Ativação de Cliente', 'Cliente', c.id, `Status: ${nextState}`);
        return updated;
      }
      return c;
    }));
    saveCustomer(updated).catch(() => {
      setCustomers(prev => prev.map(item => item.id === current.id ? current : item));
      addToast(`Não foi possível alterar o status de ${current.name}.`, 'error');
    });
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
    insertPet(newPet).catch(() => {
      setPets(prev => prev.filter(item => item.id !== newPet.id));
      addToast(`Não foi possível cadastrar ${newPet.name}.`, 'error');
    });
    addToast(`Pet ${newPet.name} cadastrado(a)!`, 'success');
    logAudit('Novo Pet', 'Pet', newPet.id, `${newPet.name} (${newPet.species})`);
    return newPet;
  };

  const updatePet = (updated: Pet) => {
    const previous = pets.find(item => item.id === updated.id);
    setPets(prev => prev.map(p => p.id === updated.id ? updated : p));
    savePet(updated).catch(() => {
      if (previous) setPets(prev => prev.map(item => item.id === previous.id ? previous : item));
      addToast(`Não foi possível atualizar ${updated.name}.`, 'error');
    });
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
    insertService(newSrv).catch(() => {
      setServices(prev => prev.filter(item => item.id !== newSrv.id));
      addToast(`Não foi possível cadastrar ${newSrv.name}.`, 'error');
    });
    addToast(`Serviço ${newSrv.name} adicionado!`, 'success');
    logAudit('Novo Serviço', 'Serviço', newSrv.id, newSrv.name);
    return newSrv;
  };

  const updateService = (updated: Service) => {
    const previous = services.find(item => item.id === updated.id);
    setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
    saveService(updated).catch(() => {
      if (previous) setServices(prev => prev.map(item => item.id === previous.id ? previous : item));
      addToast(`Não foi possível atualizar ${updated.name}.`, 'error');
    });
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
    insertAppointment(newApp).catch(() => {
      setAppointments(prev => prev.filter(item => item.id !== newApp.id));
      addToast(`Não foi possível criar o agendamento de ${newApp.pet_name}.`, 'error');
    });
    addToast(`Agendamento criado para ${newApp.pet_name}!`, 'success');
    logAudit('Novo Agendamento', 'Agendamento', newApp.id, `${newApp.pet_name} - ${newApp.scheduled_at}`);
    return newApp;
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus, reason?: string) => {
    const previous = appointments.find(item => item.id === id);
    if (!previous) return;
    const nextAppointment = {
      ...previous,
      status,
      cancellation_reason: reason || previous.cancellation_reason,
    };
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        addToast(`Agendamento de ${a.pet_name} alterado para "${status.replace('_', ' ').toUpperCase()}"`, 'info');
        logAudit('Status de Agendamento', 'Agendamento', id, `De ${a.status} para ${status}`);
        return nextAppointment;
      }
      return a;
    }));
    saveAppointment(nextAppointment).catch(() => {
      setAppointments(prev => prev.map(item => item.id === previous.id ? previous : item));
      addToast('Não foi possível alterar o status do agendamento.', 'error');
    });
  };

  const updateAppointment = (updated: Appointment) => {
    const previous = appointments.find(item => item.id === updated.id);
    setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
    saveAppointment(updated).catch(() => {
      if (previous) setAppointments(prev => prev.map(item => item.id === previous.id ? previous : item));
      addToast('Não foi possível atualizar o agendamento.', 'error');
    });
    addToast(`Agendamento de ${updated.pet_name} atualizado!`, 'success');
    logAudit('Edição de Agendamento', 'Agendamento', updated.id, updated.pet_name);
  };

  // Service Orders (Comandas)
  const addServiceOrder = async (data: Omit<ServiceOrder, 'id' | 'company_id' | 'order_number'>) => {
    try {
      if (!data.appointment_id) throw new Error('Agendamento não informado.');
      await openServiceOrder(data.appointment_id);
      const [orders, operational] = await Promise.all([loadServiceOrders(company.id), loadOperationalData(company.id)]);
      setServiceOrders(orders.orders);
      setFinancialTransactions(orders.financialTransactions);
      setAppointments(operational.appointments);
      addToast(`Comanda gerada para ${data.pet_name}!`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Não foi possível abrir a comanda.', 'error');
      throw error;
    }
  };

  const addServiceOrderItem = async (orderId: string, type: 'service' | 'product' | 'internal_consumption', itemId: string, quantity: number) => {
    try {
      await addOrderItem(orderId, type, itemId, quantity);
      const orders = await loadServiceOrders(company.id);
      setServiceOrders(orders.orders);
      addToast('Item adicionado à comanda!', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Não foi possível adicionar o item.', 'error');
      throw error;
    }
  };

  const updateServiceOrder = (updated: ServiceOrder) => {
    setServiceOrders(prev => prev.map(so => so.id === updated.id ? updated : so));
    addToast(`Comanda #${updated.order_number} atualizada!`, 'info');
  };

  const finalizeServiceOrder = async (id: string, paymentMethod: string, paidAmount: number) => {
    const so = serviceOrders.find(s => s.id === id);
    if (!so) throw new Error('Comanda não encontrada.');
    try {
      const receipt = await payServiceOrder(id, paidAmount, paymentMethod);
      const [orders, commercial, operational] = await Promise.all([
        loadServiceOrders(company.id), loadCommercialData(company.id), loadOperationalData(company.id),
      ]);
      setServiceOrders(orders.orders);
      setFinancialTransactions(orders.financialTransactions);
      setProducts(commercial.products);
      setStockMovements(commercial.stockMovements);
      setCustomers(operational.customers);
      setAppointments(operational.appointments);
      addToast(`Pagamento da comanda #${receipt.order_number} registrado!`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Não foi possível receber a comanda.', 'error');
      throw error;
    }
  };

  // Products & Stock
  const addProduct = (data: Omit<Product, 'id' | 'company_id'>) => {
    const newProd: Product = {
      ...data,
      id: generateId(),
      company_id: company.id,
      sale_price: data.selling_price ?? data.sale_price ?? 0,
      selling_price: data.selling_price ?? data.sale_price ?? 0,
      min_stock: data.minimum_stock ?? data.min_stock ?? 0,
      minimum_stock: data.minimum_stock ?? data.min_stock ?? 0,
      max_stock: data.max_stock ?? 0,
      sell_by_weight: data.sell_by_weight ?? false,
      profit_margin_percent: data.profit_margin_percent ?? 0,
      created_at: new Date().toISOString(),
    };
    setProducts(prev => [newProd, ...prev]);
    insertProduct(newProd).catch(() => {
      setProducts(prev => prev.filter(item => item.id !== newProd.id));
      addToast(`Não foi possível cadastrar ${newProd.name}.`, 'error');
    });
    addToast(`Produto ${newProd.name} cadastrado!`, 'success');
    logAudit('Novo Produto', 'Produto', newProd.id, newProd.name);
    return newProd;
  };

  const updateProduct = (updated: Product) => {
    const previous = products.find(item => item.id === updated.id);
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    saveProduct(updated).catch(() => {
      if (previous) setProducts(prev => prev.map(item => item.id === previous.id ? previous : item));
      addToast(`Não foi possível atualizar ${updated.name}.`, 'error');
    });
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

  const adjustStock = async (productId: string, quantity: number, movementType: string, reason: string) => {
    try {
      await adjustProductStock(productId, quantity, movementType, reason);
      const commercial = await loadCommercialData(company.id);
      setProducts(commercial.products);
      setStockMovements(commercial.stockMovements);
      addToast('Movimentação de estoque registrada!', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Não foi possível ajustar o estoque.', 'error');
      throw error;
    }
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

  const recordSale = async (data: SaleInput) => {
    try {
      const receipt = await completeProductSale(data);
      const [commercial, operational] = await Promise.all([
        loadCommercialData(company.id),
        loadOperationalData(company.id),
      ]);
      setProducts(commercial.products);
      setStockMovements(commercial.stockMovements);
      setSales(commercial.sales);
      setCustomers(operational.customers);
      addToast(`Venda #${receipt.sale_number} concluída com sucesso!`, 'success');
      return receipt;
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Não foi possível concluir a venda.', 'error');
      throw error;
    }
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
    insertFinancialTransaction(newTrans).catch(() => {
      setFinancialTransactions(prev => prev.filter(item => item.id !== newTrans.id));
      addToast('Não foi possível salvar o lançamento financeiro.', 'error');
    });
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

  const openCashRegister = async (initialCash: number) => {
    const opened = await openCash(initialCash);
    setCashRegister(opened);
    addToast('Caixa aberto com sucesso!', 'success');
  };

  const closeCashRegister = async (actualCash: number) => {
    const closed = await closeCash(actualCash);
    setCashRegister(closed);
    addToast(`Caixa fechado. Diferença: ${formatBRL(closed.difference || 0)}`, closed.difference === 0 ? 'success' : 'warning');
    return closed;
  };

  const registerCashMovement = async (type: 'sangria' | 'suprimento', amount: number, description: string) => {
    await moveCash(type, amount, description);
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
    const opened = await loadOpenCash(company.id);
    if (opened) setCashRegister(opened);
  };

  // Suppliers & Delivery
  const addSupplier = (data: Omit<Supplier, 'id' | 'company_id'>) => {
    const newSupp: Supplier = {
      ...data,
      id: generateId(),
      company_id: company.id,
    };
    setSuppliers(prev => [...prev, newSupp]);
    insertSupplier(newSupp).catch(() => {
      setSuppliers(prev => prev.filter(item => item.id !== newSupp.id));
      addToast(`Não foi possível cadastrar ${newSupp.trade_name || newSupp.company_name}.`, 'error');
    });
    addToast(`Fornecedor ${newSupp.trade_name || newSupp.company_name} cadastrado!`, 'success');
  };

  const addDeliveryRequest = (data: Omit<DeliveryRequest, 'id' | 'company_id'>) => {
    const newReq: DeliveryRequest = {
      ...data,
      id: generateId(),
      company_id: company.id,
    };
    setDeliveryRequests(prev => [newReq, ...prev]);
    insertDeliveryRequest(newReq).catch(() => {
      setDeliveryRequests(prev => prev.filter(item => item.id !== newReq.id));
      addToast('Não foi possível agendar a busca ou entrega.', 'error');
    });
    addToast(`Transporte agendado para ${newReq.pet_name}!`, 'success');
  };

  const updateDeliveryStatus = (id: string, status: DeliveryRequest['status']) => {
    const previous = deliveryRequests.find(item => item.id === id);
    if (!previous) return;
    const updated = { ...previous, status };
    setDeliveryRequests(prev => prev.map(d => d.id === id ? updated : d));
    saveDeliveryRequest(updated).catch(() => {
      setDeliveryRequests(prev => prev.map(item => item.id === id ? previous : item));
      addToast('Não foi possível atualizar o transporte.', 'error');
    });
    addToast(`Status do transporte atualizado para "${status.toUpperCase()}"`, 'info');
  };

  return (
    <AppContext.Provider value={{
      currentView, setCurrentView,
      theme, toggleTheme,
      currentProfile, setCurrentProfile, allProfiles,
      company, updateCompany,
      customers, pets, services, appointments, serviceOrders,
      products, stockMovements, sales, financialTransactions, cashRegister,
      suppliers, deliveryRequests, consentTerms,
      addCustomer, updateCustomer, toggleCustomerActive,
      addPet, updatePet,
      addService, updateService,
      addAppointment, updateAppointmentStatus, updateAppointment,
      addServiceOrder, addServiceOrderItem, updateServiceOrder, finalizeServiceOrder,
      addProduct, updateProduct, addStockMovement, adjustStock,
      completeSale, recordSale, cancelSale,
      addFinancialTransaction, updateTransactionStatus, updateCashRegister, openCashRegister, closeCashRegister, registerCashMovement,
      addSupplier, addDeliveryRequest, updateDeliveryStatus,
      toasts, addToast, removeToast, logAudit
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
