import React, { useState } from 'react';
import { usePetGestor } from '../../context/AppContext';
import { ServiceOrder } from '../../types';
import { formatBRL, formatDate } from '../../utils/formatters';
import { 
  ClipboardList, Plus, Search, CheckCircle, 
  XCircle, Printer, Image, DollarSign, Tag, Dog, User, Trash2
} from 'lucide-react';

export const ComandasView: React.FC = () => {
  const { 
    serviceOrders, products, services, 
    addServiceOrderItem, finalizeServiceOrder,
  } = usePetGestor();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSO, setSelectedSO] = useState<ServiceOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'credito' | 'debito'>('pix');
  const [itemOrder, setItemOrder] = useState<ServiceOrder | null>(null);
  const [itemType, setItemType] = useState<'service' | 'product' | 'internal_consumption'>('product');
  const [itemId, setItemId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  const filteredOrders = serviceOrders.filter(so => {
    const term = searchTerm.toLowerCase();
    return (
      so.order_number.toString().includes(term) ||
      (so.pet_name && so.pet_name.toLowerCase().includes(term)) ||
      (so.customer_name && so.customer_name.toLowerCase().includes(term))
    );
  });

  const handlePrintReceipt = (so: ServiceOrder) => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-teal-600" />
            Gestão de Comandas Operacionais
          </h2>
          <p className="text-xs text-slate-500">
            Comandas de serviços, consumo de materiais internos, fotos antes/depois e fechamento
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar por número da comanda, pet ou tutor..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
        />
      </div>

      {/* Comandas Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Nenhuma comanda aberta ou realizada até o momento.
          </div>
        ) : (
          filteredOrders.map(so => {
            const isPaid = so.status === 'paga';

            return (
              <div
                key={so.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-extrabold text-slate-900 dark:text-white text-base">
                      Comanda #{so.order_number}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {so.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1 text-xs mb-3">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Dog className="w-4 h-4 text-teal-600" /> Pet: {so.pet_name}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" /> Tutor: {so.customer_name}
                    </p>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-slate-400 uppercase text-[10px]">Itens & Serviços:</p>
                    {so.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-semibold">{formatBRL(item.total_price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total</span>
                    <span className="text-lg font-black text-emerald-600">{formatBRL(so.total)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePrintReceipt(so)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs"
                      title="Imprimir Comprovante"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {!isPaid && (
                      <>
                        <button onClick={() => { setItemOrder(so); setItemId(''); }} className="px-3 py-1.5 border border-teal-300 text-teal-700 rounded-xl font-bold text-xs">
                          + Item
                        </button>
                        <button
                          onClick={() => setSelectedSO(so)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs"
                        >
                          Receber
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Checkout Comanda Modal */}
      {itemOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border space-y-4 text-xs">
            <h3 className="font-bold text-lg">Adicionar item à comanda #{itemOrder.order_number}</h3>
            <select value={itemType} onChange={e => { setItemType(e.target.value as typeof itemType); setItemId(''); }} className="w-full px-3 py-2 border rounded-xl">
              <option value="service">Serviço adicional</option>
              <option value="product">Produto vendido ao tutor</option>
              <option value="internal_consumption">Produto consumido no atendimento</option>
            </select>
            <select value={itemId} onChange={e => setItemId(e.target.value)} className="w-full px-3 py-2 border rounded-xl">
              <option value="">Selecione o item</option>
              {itemType === 'service'
                ? services.filter(item => item.is_active).map(item => <option key={item.id} value={item.id}>{item.name} — {formatBRL(item.base_price)}</option>)
                : products.filter(item => item.is_active && item.current_stock > 0).map(item => <option key={item.id} value={item.id}>{item.name} — estoque {item.current_stock}</option>)}
            </select>
            <input type="number" min="0.001" step="0.001" value={itemQuantity} onChange={e => setItemQuantity(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setItemOrder(null)} className="px-4 py-2 border rounded-xl">Cancelar</button>
              <button disabled={!itemId || itemQuantity <= 0} onClick={async () => { try { await addServiceOrderItem(itemOrder.id, itemType, itemId, itemQuantity); setItemOrder(null); } catch {} }} className="px-5 py-2 bg-teal-600 disabled:opacity-50 text-white rounded-xl font-bold">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {selectedSO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Fechar Comanda #{selectedSO.order_number}
            </h3>

            <p className="text-xs text-slate-500">
              Saldo a receber: <strong className="text-emerald-600 text-base">{formatBRL(selectedSO.total - selectedSO.paid_amount)}</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              >
                <option value="pix">PIX Instantâneo</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="dinheiro">Dinheiro em Espécie</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedSO(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={async () => { try { await finalizeServiceOrder(selectedSO.id, paymentMethod, selectedSO.total - selectedSO.paid_amount); setSelectedSO(null); } catch {} }}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Confirmar Recebimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
