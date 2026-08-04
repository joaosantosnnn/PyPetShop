export type UserRole = 
  | 'proprietario'
  | 'administrador'
  | 'gerente'
  | 'atendente'
  | 'caixa'
  | 'banhista'
  | 'tosador'
  | 'estoquista';

export interface Company {
  id: string;
  name: string;
  trade_name?: string;
  cnpj?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  postal_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  logo_url?: string;
  opening_time: string;
  closing_time: string;
  slot_interval_minutes: number;
  capacity_per_slot: number;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  commission_rate: number;
  last_access_at?: string;
  created_at?: string;
}

export interface BlockedTime {
  id: string;
  company_id: string;
  employee_id?: string | null;
  start_at: string;
  end_at: string;
  reason: string;
  created_by: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  cpf?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  birth_date?: string;
  postal_code?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  notes?: string;
  contact_preference: 'whatsapp' | 'telefone' | 'email';
  communication_consent: boolean;
  is_active: boolean;
  total_spent: number;
  outstanding_balance: number;
  created_at?: string;
}

export type PetSpecies = 'cao' | 'gato' | 'ave' | 'roedor' | 'outro';
export type PetGender = 'macho' | 'femea';
export type PetSize = 'pequeno' | 'medio' | 'grande' | 'gigante';
export type PetTemperament = 'docil' | 'calmo' | 'agitado' | 'medroso' | 'agressivo';

export interface Pet {
  id: string;
  company_id: string;
  customer_id: string;
  customer_name?: string;
  name: string;
  photo_url?: string;
  species: PetSpecies;
  breed?: string;
  gender: PetGender;
  birth_date?: string;
  approximate_age?: string;
  weight: number;
  size_category: PetSize;
  color?: string;
  is_neutered: boolean;
  allergies?: string;
  diseases?: string;
  medications?: string;
  restrictions?: string;
  temperament: PetTemperament;
  aggression_level: number;
  special_cares?: string;
  vet_name?: string;
  vet_phone?: string;
  notes?: string;
  is_active: boolean;
  last_visit_at?: string;
  next_suggested_visit?: string;
  created_at?: string;
}

export interface Service {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  category: string;
  estimated_duration_minutes: number;
  base_price: number;
  price_small?: number;
  price_medium?: number;
  price_large?: number;
  commission_percentage: number;
  is_active: boolean;
}

export type AppointmentStatus = 
  | 'pendente'
  | 'agendado'
  | 'confirmado'
  | 'recebido'
  | 'aguardando'
  | 'em_banho'
  | 'em_secagem'
  | 'em_tosa'
  | 'finalizando'
  | 'pronto'
  | 'entregue'
  | 'cancelado'
  | 'faltou';

export interface Appointment {
  id: string;
  company_id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  pet_id: string;
  pet_name?: string;
  pet_photo?: string;
  pet_species?: PetSpecies;
  pet_allergies?: string;
  pet_aggression?: number;
  service_id: string;
  service_name?: string;
  employee_id?: string;
  employee_name?: string;
  scheduled_at: string;
  estimated_duration_minutes: number;
  expected_price: number;
  status: AppointmentStatus;
  needs_pickup_delivery: boolean;
  pickup_address?: string;
  cancellation_reason?: string;
  notes?: string;
  created_at?: string;
}

export type ServiceOrderStatus = 
  | 'aberta'
  | 'em_atendimento'
  | 'aguardando_pagamento'
  | 'paga'
  | 'parcialmente_paga'
  | 'cancelada';

export interface ServiceOrderItem {
  id: string;
  service_order_id: string;
  type: 'service' | 'product' | 'internal_consumption';
  item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  assigned_employee_id?: string;
  commission_amount?: number;
}

export interface ServiceOrder {
  id: string;
  order_number: number;
  company_id: string;
  appointment_id?: string;
  customer_id: string;
  customer_name?: string;
  pet_id: string;
  pet_name?: string;
  status: ServiceOrderStatus;
  photo_before_url?: string;
  photo_after_url?: string;
  tutor_signature_accepted: boolean;
  items: ServiceOrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid_amount: number;
  notes?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  internal_code?: string;
  barcode?: string;
  unit: string;
  sell_by_weight: boolean;
  cost_price: number;
  sale_price: number;
  selling_price: number;
  profit_margin_percent: number;
  current_stock: number;
  min_stock: number;
  minimum_stock: number;
  max_stock: number;
  supplier_name?: string;
  location_in_store?: string;
  photo_url?: string;
  batch_number?: string;
  expiration_date?: string;
  next_batch_number?: string;
  next_expiration_date?: string;
  is_active: boolean;
  created_at?: string;
}

export type StockMovementType = 
  | 'compra'
  | 'entrada_manual'
  | 'venda'
  | 'consumo_servico'
  | 'devolucao'
  | 'perda'
  | 'avaria'
  | 'vencimento'
  | 'ajuste_positivo'
  | 'ajuste_negativo'
  | 'inventario';

export interface StockMovement {
  id: string;
  company_id: string;
  product_id: string;
  product_name?: string;
  movement_type: StockMovementType;
  quantity: number;
  unit_cost: number;
  batch_number?: string;
  expiration_date?: string;
  reason?: string;
  previous_stock: number;
  new_stock: number;
  created_by_name?: string;
  created_at: string;
}

export interface InventoryCountItem { id:string; company_id:string; inventory_count_id:string; product_id:string; product_name:string; expected_quantity:number; counted_quantity:number|null; difference:number|null }
export interface InventoryCount { id:string; company_id:string; name:string; status:'aberto'|'concluido'|'cancelado'; created_by:string; completed_by?:string; created_at:string; completed_at?:string; items:InventoryCountItem[] }

export type PaymentMethod = 
  | 'dinheiro'
  | 'pix'
  | 'debito'
  | 'credito'
  | 'fiado'
  | 'credito_cliente'
  | 'misto';

export interface CartItem {
  product?: Product;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  sale_number: number;
  company_id: string;
  customer_id?: string;
  customer_name?: string;
  seller_id?: string;
  seller_name?: string;
  items: any[];
  subtotal: number;
  discount: number;
  total_amount: number;
  total?: number;
  payment_method: PaymentMethod;
  amount_paid?: number;
  change_amount?: number;
  status: 'concluida' | 'cancelada' | 'devolvida';
  notes?: string;
  created_at: string;
}

export type TransactionType = 'receita' | 'despesa' | 'sangria' | 'suprimento';
export type TransactionStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado';

export interface FinancialTransaction {
  id: string;
  company_id: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: TransactionStatus;
  payment_method?: PaymentMethod;
  customer_id?: string;
  customer_name?: string;
  supplier_name?: string;
  created_at: string;
}

export interface CashRegister {
  id: string;
  company_id: string;
  user_id: string;
  user_name: string;
  opened_at: string;
  closed_at?: string;
  initial_cash: number;
  expected_cash?: number;
  actual_cash?: number;
  difference?: number;
  status: 'aberto' | 'fechado';
  total_sales_cash: number;
  total_sales_pix: number;
  total_sales_card: number;
  total_sales_credit: number;
  total_supplements: number;
  total_withdrawals: number;
}

export interface Supplier {
  id: string;
  company_id: string;
  company_name: string;
  trade_name?: string;
  cnpj?: string;
  contact_person?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
}

export interface PurchaseOrder {
  id: string;
  company_id: string;
  supplier_id: string;
  supplier_name?: string;
  order_number: number;
  status: 'rascunho' | 'enviado' | 'recebido_parcial' | 'recebido' | 'cancelado';
  total_amount: number;
  subtotal: number;
  discount: number;
  freight: number;
  due_date: string;
  expected_delivery_date?: string;
  received_date?: string;
  notes?: string;
  created_at: string;
  items: PurchaseOrderItem[];
}
export interface PurchaseOrderItem{id:string;company_id:string;purchase_order_id:string;product_id:string;product_name:string;quantity:number;received_quantity:number;unit_cost:number;total_cost:number;batch_number?:string;expiration_date?:string;created_at:string}

export interface DeliveryRequest {
  id: string;
  company_id: string;
  customer_id: string;
  customer_name?: string;
  pet_id: string;
  pet_name?: string;
  type: 'busca' | 'entrega' | 'ambos';
  address: string;
  scheduled_at: string;
  driver_id?: string;
  driver_name?: string;
  delivery_fee: number;
  status: 'pendente' | 'em_transito' | 'concluido' | 'cancelado';
  notes?: string;
  delivered_to_person?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoyaltyPackage {
  id: string;
  company_id: string;
  service_package_id: string;
  customer_id: string;
  customer_name?: string;
  pet_id: string;
  pet_name?: string;
  service_id: string;
  service_name?: string;
  package_name: string;
  total_uses: number;
  used_uses: number;
  price_paid: number;
  starts_at: string;
  expires_at: string;
  status: 'ativo' | 'expirado' | 'concluido' | 'cancelado';
  created_by: string;
  created_at?: string;
}

export interface StampCard {
  id: string;
  customer_id: string;
  stamps_count: number;
  reward_unlocked: boolean;
}

export interface LiabilityTerm {
  id: string;
  company_id: string;
  title: string;
  term_type: string;
  content: string;
  version: number;
  is_required: boolean;
  is_active: boolean;
  valid_days?: number;
  created_by: string;
  created_at?: string;
}

export type ConsentTerm = LiabilityTerm;

export interface PetIncident {
  id: string;
  company_id: string;
  appointment_id?: string;
  checkin_id?: string;
  pet_id: string;
  customer_id: string;
  incident_type: string;
  severity: 'leve' | 'moderado' | 'grave' | 'critico';
  description: string;
  actions_taken?: string;
  photo_urls: string[];
  tutor_notified: boolean;
  tutor_notified_at?: string;
  occurred_at: string;
  created_by: string;
  created_at?: string;
}

export interface TermAcceptance { id:string;company_id:string;term_id:string;customer_id:string;pet_id?:string;appointment_id?:string;term_title:string;term_content:string;term_version:number;accepted_by_name:string;accepted_at:string;expires_at?:string;created_by:string;created_at?:string; }
export interface PetCheckin { id:string;company_id:string;appointment_id?:string;customer_id:string;pet_id:string;responsible_name:string;weight?:number;pre_existing_conditions?:string;belongings?:string;observations?:string;photo_urls:string[];status:'entrada'|'em_atendimento'|'finalizado'|'entregue';checked_in_at:string;checked_out_at?:string;created_by:string;created_at?:string;updated_at?:string; }
export interface PetWeightRecord { id:string;company_id:string;pet_id:string;weight:number;source:'cadastro'|'atualizacao'|'checkin'|'manual';source_id?:string;notes?:string;recorded_by?:string;recorded_at:string;created_at?:string; }
export interface CustomerCommunication {id:string;company_id:string;customer_id:string;pet_id?:string;appointment_id?:string;customer_package_id?:string;communication_type:'confirmacao'|'lembrete'|'pet_pronto'|'retorno'|'aniversario'|'pacote_vencendo'|'manual';channel:'whatsapp'|'telefone'|'email';recipient:string;message:string;scheduled_at:string;status:'pendente'|'enviado'|'cancelado'|'falhou';sent_at?:string;sent_by?:string;created_by?:string;created_at:string;updated_at?:string}

export interface AuditLog {
  id: number;
  company_id: string;
  actor_id?: string;
  actor_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  entity_type: string;
  entity_id?: string;
  before_data?: Record<string, unknown>;
  after_data?: Record<string, unknown>;
  created_at: string;
}
