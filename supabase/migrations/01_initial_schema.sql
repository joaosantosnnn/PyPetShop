-- PetGestor Initial Schema & Security Rules
-- Compatible with Supabase PostgreSQL & RLS

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    cnpj VARCHAR(20),
    phone VARCHAR(30),
    whatsapp VARCHAR(30),
    email VARCHAR(255),
    postal_code VARCHAR(10),
    street VARCHAR(255),
    number VARCHAR(20),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    logo_url TEXT,
    opening_time TIME DEFAULT '08:00',
    closing_time TIME DEFAULT '18:00',
    slot_interval_minutes INT DEFAULT 30,
    capacity_per_slot INT DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(50) NOT NULL DEFAULT 'atendente', -- proprietario, administrador, gerente, atendente, caixa, banhista, tosador, estoquista
    is_active BOOLEAN DEFAULT TRUE,
    commission_rate NUMERIC(5, 2) DEFAULT 0.00,
    last_access_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CUSTOMERS (Tutores)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    phone VARCHAR(30),
    whatsapp VARCHAR(30),
    email VARCHAR(255),
    birth_date DATE,
    postal_code VARCHAR(10),
    address VARCHAR(255),
    number VARCHAR(20),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    notes TEXT,
    contact_preference VARCHAR(50) DEFAULT 'whatsapp',
    communication_consent BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    total_spent NUMERIC(10, 2) DEFAULT 0.00,
    outstanding_balance NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PETS
CREATE TABLE IF NOT EXISTS public.pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    species VARCHAR(50) NOT NULL, -- cao, gato, ave, roedor, outro
    breed VARCHAR(100),
    gender VARCHAR(10), -- macho, femea
    birth_date DATE,
    approximate_age VARCHAR(50),
    weight NUMERIC(6, 2),
    size_category VARCHAR(20) DEFAULT 'medio', -- pequeno, medio, grande, gigante
    color VARCHAR(50),
    is_neutered BOOLEAN DEFAULT FALSE,
    allergies TEXT,
    diseases TEXT,
    medications TEXT,
    restrictions TEXT,
    temperament VARCHAR(50) DEFAULT 'calmo', -- dócil, calmo, agitado, medroso, agressivo
    aggression_level INT DEFAULT 1, -- 1 to 5
    special_cares TEXT,
    vet_name VARCHAR(255),
    vet_phone VARCHAR(30),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_visit_at TIMESTAMP WITH TIME ZONE,
    next_suggested_visit DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SERVICES
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'Banho e Tosa',
    estimated_duration_minutes INT DEFAULT 45,
    base_price NUMERIC(10, 2) NOT NULL,
    price_small NUMERIC(10, 2),
    price_medium NUMERIC(10, 2),
    price_large NUMERIC(10, 2),
    commission_percentage NUMERIC(5, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.profiles(id),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_duration_minutes INT DEFAULT 45,
    expected_price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'agendado', -- pendente, agendado, confirmado, recebido, aguardando, em_banho, em_secagem, em_tosa, finalizando, pronto, entregue, cancelado, faltou
    needs_pickup_delivery BOOLEAN DEFAULT FALSE,
    pickup_address TEXT,
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SERVICE ORDERS (Comandas)
CREATE TABLE IF NOT EXISTS public.service_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number SERIAL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    pet_id UUID NOT NULL REFERENCES public.pets(id),
    status VARCHAR(50) DEFAULT 'aberta', -- aberta, em_atendimento, aguardando_pagamento, paga, parcialmente_paga, cancelada
    photo_before_url TEXT,
    photo_after_url TEXT,
    tutor_signature_accepted BOOLEAN DEFAULT FALSE,
    subtotal NUMERIC(10, 2) DEFAULT 0.00,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) DEFAULT 0.00,
    paid_amount NUMERIC(10, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'Geral',
    brand VARCHAR(100),
    internal_code VARCHAR(50),
    barcode VARCHAR(100),
    unit VARCHAR(20) DEFAULT 'un', -- un, kg, g, ml, l
    sell_by_weight BOOLEAN DEFAULT FALSE,
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    profit_margin_percent NUMERIC(5, 2) DEFAULT 0.00,
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    min_stock NUMERIC(10, 2) DEFAULT 5.00,
    max_stock NUMERIC(10, 2) DEFAULT 100.00,
    location_in_store VARCHAR(100),
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. STOCK MOVEMENTS
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL, -- compra, entrada_manual, venda, consumo_servico, devolucao, perda, avaria, vencimento, ajuste_positivo, ajuste_negativo, inventario
    quantity NUMERIC(10, 2) NOT NULL,
    unit_cost NUMERIC(10, 2) DEFAULT 0.00,
    batch_number VARCHAR(100),
    expiration_date DATE,
    reason TEXT,
    previous_stock NUMERIC(10, 2) NOT NULL,
    new_stock NUMERIC(10, 2) NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. SALES & SALE ITEMS
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_number SERIAL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id),
    seller_id UUID REFERENCES public.profiles(id),
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- dinheiro, pix, debito, credito, fiado, credito_cliente, misto
    status VARCHAR(50) DEFAULT 'concluida', -- concluida, cancelada, devolvida
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL
);

-- 11. FINANCIAL TRANSACTIONS (Accounts Payable / Receivable / Cash Register)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- receita, despesa, sangria, suprimento
    category VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(30) DEFAULT 'pendente', -- pendente, pago, atrasado, cancelado
    payment_method VARCHAR(50),
    customer_id UUID REFERENCES public.customers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    previous_data JSONB,
    new_data JSONB,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES (Row Level Security)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Default Permissive RLS Policies for authenticated company scope
CREATE POLICY "Allow company members full access" ON public.customers FOR ALL USING (true);
CREATE POLICY "Allow company members full access" ON public.pets FOR ALL USING (true);
CREATE POLICY "Allow company members full access" ON public.services FOR ALL USING (true);
CREATE POLICY "Allow company members full access" ON public.appointments FOR ALL USING (true);
CREATE POLICY "Allow company members full access" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow company members full access" ON public.sales FOR ALL USING (true);
CREATE POLICY "Allow company members full access" ON public.financial_transactions FOR ALL USING (true);
