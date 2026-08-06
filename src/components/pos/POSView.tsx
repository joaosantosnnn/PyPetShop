import React, { useEffect, useState } from 'react';
import { usePetGestor } from '../../context/AppContext';
import { Product, Customer } from '../../types';
import { formatBRL } from '../../utils/formatters';
import { 
  ShoppingCart, Search, Barcode, Trash2, Plus, 
  Minus, DollarSign, CreditCard, QrCode, User, CheckCircle2, Printer
} from 'lucide-react';
import { loadCustomerCreditBalance } from '../../services/refundRepository';
import { fallbackFinancialPaymentMethods, loadFinancialPaymentMethods, type FinancialPaymentMethod } from '../../services/financialRepository';

export const POSView: React.FC = () => {
  const { company, products, services, customers, sales, recordSale, cancelSale } = usePetGestor();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  // Basket state
  const [cartItems, setCartItems] = useState<{
    id: string;
    type: 'product' | 'service';
    item_id: string;
    name: string;
    unit_price: number;
    quantity: number;
    total_price: number;
  }[]>([]);

  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito'>('pix');
  const [paymentMethods, setPaymentMethods] = useState<FinancialPaymentMethod[]>([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [useCredit, setUseCredit] = useState(false);
  const [creditAmount, setCreditAmount] = useState(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [lastSaleReceipt, setLastSaleReceipt] = useState<any | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    setUseCredit(false); setCreditAmount(0);
    if (!selectedCustomerId) { setCreditBalance(0); return; }
    loadCustomerCreditBalance(selectedCustomerId).then(setCreditBalance).catch(() => setCreditBalance(0));
  }, [selectedCustomerId]);

  useEffect(() => {
    loadFinancialPaymentMethods(company.id).then(rows => {
      const accepted = rows.filter(row => row.is_active && ['pix','dinheiro','cartao_credito','cartao_debito'].includes(row.code));
      setPaymentMethods(accepted);
      if (accepted.length && !accepted.some(row => row.code === paymentMethod)) setPaymentMethod(accepted[0].code as typeof paymentMethod);
    }).catch(() => setPaymentMethods(fallbackFinancialPaymentMethods(company.id).filter(row => ['pix','dinheiro','cartao_credito','cartao_debito'].includes(row.code))));
  }, [company.id]);

  // Filter products for catalog
  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term))
    );
  });

  const handleAddToCart = (product: Product) => {
    if (product.current_stock <= 0) return;

    setCartItems(prev => {
      const existing = prev.find(i => i.item_id === product.id);
      if (existing) {
        if (existing.quantity >= product.current_stock) return prev;
        return prev.map(i => 
          i.item_id === product.id 
            ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.unit_price }
            : i
        );
      }
      return [
        ...prev,
        {
          id: `cart-${Date.now()}-${Math.random()}`,
          type: 'product',
          item_id: product.id,
          name: product.name,
          unit_price: product.selling_price,
          quantity: 1,
          total_price: product.selling_price,
        }
      ];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, total_price: newQty * item.unit_price };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const subtotal = cartItems.reduce((acc, i) => acc + i.total_price, 0);
  const finalTotal = Math.max(0, subtotal - discount);
  const appliedCredit = useCredit ? Math.min(Math.max(creditAmount, 0), creditBalance, finalTotal) : 0;
  const complementaryAmount = Math.max(0, finalTotal - appliedCredit);
  const changeAmount = paymentMethod === 'dinheiro' ? Math.max(0, amountPaid - complementaryAmount) : 0;

  const handleFinalizeSale = async () => {
    if (cartItems.length === 0 || paymentMethods.length === 0) return;

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    const saleRecord = {
      customer_id: selectedCustomer?.id,
      customer_name: selectedCustomer?.name || 'Cliente Avulso',
      items: cartItems.map(i => ({
        type: i.type,
        item_id: i.item_id,
        name: i.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price,
      })),
      subtotal,
      discount,
      total_amount: finalTotal,
      payment_method: paymentMethod,
      amount_paid: paymentMethod === 'dinheiro' ? amountPaid : complementaryAmount,
      credit_amount: appliedCredit,
      change_amount: changeAmount,
    };

    setIsFinalizing(true);
    try {
      const receipt = await recordSale(saleRecord);
      setLastSaleReceipt({ ...saleRecord, ...receipt });
      setCartItems([]);
      setDiscount(0);
      setAmountPaid(0);
      setUseCredit(false);
      setCreditAmount(0);
      if (selectedCustomerId) setCreditBalance(await loadCustomerCreditBalance(selectedCustomerId));
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-teal-600" />
            Frente de Caixa (PDV)
          </h2>
          <p className="text-xs text-slate-500">
            Ponto de venda rápido com suporte a código de barras e baixa automática de estoque
          </p>
        </div>
      </div>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-bold text-sm">Vendas recentes e devolucoes</h3><p className="text-[11px] text-slate-500">A devolucao e integral e repoe automaticamente todos os produtos.</p></div>
        <div className="divide-y text-xs">{sales.slice(0,20).map(sale=><div key={sale.id} className="p-3 flex flex-wrap items-center justify-between gap-2"><span><b>Venda #{sale.sale_number} · {sale.customer_name||'Cliente avulso'}</b><small className="block text-slate-500">{new Date(sale.created_at).toLocaleString('pt-BR')} · {formatBRL(sale.total_amount)}</small></span><div className="flex items-center gap-2"><span className="uppercase text-[10px] font-bold">{sale.status}</span>{sale.status==='concluida'&&<button onClick={async()=>{const reason=prompt('Motivo da devolucao:')||'';if(reason)try{await cancelSale(sale.id,reason)}catch{}}} className="px-3 py-2 border border-rose-300 text-rose-600 rounded-xl font-bold">Devolver venda</button>}</div></div>)}</div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Catalog & Search (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Escanear código de barras ou buscar produto..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <Barcode className="w-6 h-6 text-slate-400" />
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar p-1">
            {filteredProducts.map(p => {
              const isOut = p.current_stock <= 0;

              return (
                <button
                  key={p.id}
                  disabled={isOut}
                  onClick={() => handleAddToCart(p)}
                  className={`bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs text-left transition flex flex-col justify-between h-32 ${
                    isOut ? 'opacity-50 cursor-not-allowed' : 'hover:border-teal-500 hover:shadow-md'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{p.category}</span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-2 leading-tight">
                      {p.name}
                    </h4>
                  </div>

                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        {isOut ? 'Sem Estoque' : `Estoque: ${p.current_stock}`}
                      </span>
                      <span className="font-extrabold text-teal-600 dark:text-teal-400 text-sm">
                        {formatBRL(p.selling_price)}
                      </span>
                    </div>

                    <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Basket & Payment (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-teal-600" /> Carrinho Atual
              </h3>

              {/* Customer Selector */}
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
              >
                <option value="">Cliente Avulso (Sem cadastro)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Basket Items List */}
            <div className="my-4 space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  O carrinho está vazio. Clique em um produto ao lado para adicionar.
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400">{formatBRL(item.unit_price)} un.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => handleUpdateQuantity(item.id, -1)} className="p-1 rounded bg-slate-200 dark:bg-slate-700">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold px-1">{item.quantity}</span>
                      <button onClick={() => handleAddToCart(products.find(p => p.id === item.item_id)!)} className="p-1 rounded bg-slate-200 dark:bg-slate-700">
                        <Plus className="w-3 h-3" />
                      </button>

                      <span className="font-extrabold text-teal-600 w-16 text-right">
                        {formatBRL(item.total_price)}
                      </span>

                      <button onClick={() => handleRemoveFromCart(item.id)} className="p-1 text-rose-500 hover:text-rose-700 ml-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-bold">{formatBRL(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-400">Desconto (R$):</span>
              <input
                type="number"
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                className="w-24 px-2 py-1 border rounded-lg text-right font-bold"
              />
            </div>

            {/* Total Display */}
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900 flex items-center justify-between">
              <span className="font-bold text-teal-900 dark:text-teal-200 text-sm">TOTAL FINAL</span>
              <span className="font-black text-teal-700 dark:text-teal-300 text-2xl">{formatBRL(finalTotal)}</span>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Método de Pagamento</label>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {paymentMethods.map(method => {
                  const m = { id: method.code, label: method.name, icon: method.code === 'pix' ? QrCode : method.code === 'dinheiro' ? DollarSign : CreditCard };
                  return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition ${
                      paymentMethod === m.id 
                        ? 'border-teal-600 bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200' 
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <m.icon className="w-3.5 h-3.5" /> {m.label}
                  </button>
                  );
                })}
              </div>
            </div>

            {selectedCustomerId && (
              <div className="space-y-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-emerald-800 dark:text-emerald-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <span><input type="checkbox" checked={useCredit} disabled={creditBalance<=0} onChange={e=>{setUseCredit(e.target.checked);setCreditAmount(e.target.checked?Math.min(creditBalance,finalTotal):0)}} className="mr-2" />Usar saldo de crédito</span>
                  <strong>{formatBRL(creditBalance)}</strong>
                </label>
                {useCredit && <input type="number" min="0.01" step="0.01" max={Math.min(creditBalance,finalTotal)} value={creditAmount}
                  onChange={e=>setCreditAmount(Number(e.target.value))} className="w-full px-2 py-1 rounded-lg border text-slate-900 font-bold" />}
              </div>
            )}

            {useCredit && <div className="flex justify-between font-semibold"><span>Restante na outra forma</span><span>{formatBRL(complementaryAmount)}</span></div>}

            {paymentMethod === 'dinheiro' && (
              <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div>
                  <label className="block text-[10px] text-slate-500">Valor entregue para o restante</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={e => setAmountPaid(Number(e.target.value))}
                    className="w-full px-2 py-1 border rounded text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Troco a Devolver</label>
                  <span className="font-black text-emerald-600 text-sm block mt-1">{formatBRL(changeAmount)}</span>
                </div>
              </div>
            )}

            <button
              disabled={cartItems.length === 0 || paymentMethods.length === 0 || isFinalizing || (useCredit && (!selectedCustomerId || creditAmount<=0 || creditAmount>creditBalance || creditAmount>finalTotal)) || (paymentMethod==='dinheiro' && complementaryAmount>0 && amountPaid<complementaryAmount)}
              onClick={handleFinalizeSale}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition"
            >
              {isFinalizing ? 'Finalizando venda...' : 'Finalizar Venda & Emitir Recibo'}
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {lastSaleReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="text-center space-y-1 border-b pb-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-black text-lg text-slate-900 dark:text-white">Venda Concluída!</h3>
              <p className="text-xs text-slate-500">Recibo gerado para o cliente</p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <p><span className="font-semibold">Cliente:</span> {lastSaleReceipt.customer_name}</p>
              <p><span className="font-semibold">Pagamento:</span> {lastSaleReceipt.payment_method.toUpperCase()}</p>
              {lastSaleReceipt.credit_amount>0 && <p><span className="font-semibold">Saldo de crédito:</span> {formatBRL(lastSaleReceipt.credit_amount)}</p>}
              {lastSaleReceipt.credit_amount>0 && lastSaleReceipt.complement_amount>0 && <p><span className="font-semibold">Complemento ({lastSaleReceipt.payment_method.toUpperCase()}):</span> {formatBRL(lastSaleReceipt.complement_amount)}</p>}
              <p><span className="font-semibold">Total Pago:</span> <strong className="text-emerald-600">{formatBRL(lastSaleReceipt.total_amount)}</strong></p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setLastSaleReceipt(null)}
                className="w-full py-2 border rounded-xl text-xs font-semibold"
              >
                Nova Venda
              </button>
              <button
                onClick={() => window.print()}
                className="w-full py-2 bg-teal-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Recibo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
