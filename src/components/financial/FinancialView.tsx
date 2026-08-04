import React, { useState } from 'react';
import { PixPaymentsPanel } from './PixPaymentsPanel';
import { PixReceiptsPanel } from './PixReceiptsPanel';
import { usePetGestor } from '../../context/AppContext';
import { formatBRL, formatDate } from '../../utils/formatters';
import { 
  TrendingUp, TrendingDown, DollarSign, Plus, 
  Calendar, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, FileText 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const FinancialView: React.FC = () => {
  const { financialTransactions, addFinancialTransaction, cashRegister, openCashRegister, closeCashRegister, registerCashMovement } = usePetGestor();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(100);
  const [type, setType] = useState<'receita' | 'despesa'>('despesa');
  const [category, setCategory] = useState('Fornecedores');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));

  const totalReceitas = financialTransactions.filter(t => t.type === 'receita').reduce((a, b) => a + b.amount, 0);
  const totalDespesas = financialTransactions.filter(t => t.type === 'despesa').reduce((a, b) => a + b.amount, 0);
  const netProfit = totalReceitas - totalDespesas;

  // Chart data for cash flow
  const chartData = [
    { name: 'Semana 1', Receitas: totalReceitas * 0.2, Despesas: totalDespesas * 0.25 },
    { name: 'Semana 2', Receitas: totalReceitas * 0.3, Despesas: totalDespesas * 0.2 },
    { name: 'Semana 3', Receitas: totalReceitas * 0.25, Despesas: totalDespesas * 0.3 },
    { name: 'Semana 4', Receitas: totalReceitas * 0.25, Despesas: totalDespesas * 0.25 },
  ];

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    addFinancialTransaction({
      description,
      amount: Number(amount),
      type,
      category,
      due_date: dueDate,
      status: 'pago',
      payment_method: 'pix',
    });
    setIsModalOpen(false);
    setDescription('');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <PixPaymentsPanel />
      <PixReceiptsPanel />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-teal-600" />
            Gestão Financeira & DRE
          </h2>
          <p className="text-xs text-slate-500">
            Contas a pagar, contas a receber, fluxo de caixa e DRE operacional
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
        {cashRegister.status === 'fechado' ? <button onClick={async()=>{const value=Number(window.prompt('Valor inicial em dinheiro:','0'));if(Number.isFinite(value)&&value>=0)await openCashRegister(value);}} className="px-4 py-2 rounded-xl border border-emerald-300 text-emerald-700 text-xs font-bold">Abrir Caixa</button> : <>
          <button onClick={async()=>{const value=Number(window.prompt('Valor da sangria:','0'));const reason=window.prompt('Motivo da sangria:','Retirada do caixa');if(value>0&&reason)await registerCashMovement('sangria',value,reason);}} className="px-3 py-2 rounded-xl border text-xs font-bold">Sangria</button>
          <button onClick={async()=>{const value=Number(window.prompt('Valor do suprimento:','0'));const reason=window.prompt('Motivo do suprimento:','Reforço de caixa');if(value>0&&reason)await registerCashMovement('suprimento',value,reason);}} className="px-3 py-2 rounded-xl border text-xs font-bold">Suprimento</button>
          <button onClick={async()=>{const value=Number(window.prompt('Dinheiro contado no caixa:','0'));if(Number.isFinite(value)&&value>=0)await closeCashRegister(value);}} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">Fechar Caixa</button>
        </>}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" /> Nova Lançamento Financeiro
        </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Receitas Brutas</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {formatBRL(totalReceitas)}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Despesas / Insumos</span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {formatBRL(totalDespesas)}
            </div>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Resultado Líquido (DRE)</span>
            <div className={`text-2xl font-black mt-1 ${netProfit >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
              {formatBRL(netProfit)}
            </div>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-950/60 rounded-xl text-teal-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Evolução Semanal do Fluxo de Caixa</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(value: any) => formatBRL(Number(value))} />
              <Area type="monotone" dataKey="Receitas" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="Despesas" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-sm">
          Histórico de Movimentações Financeiras
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {financialTransactions.map(t => (
            <div key={t.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{t.description}</p>
                <p className="text-[11px] text-slate-400">{t.category} • Vencimento: {formatDate(t.due_date)}</p>
              </div>

              <div className="text-right">
                <span className={`font-black text-sm ${t.type === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'receita' ? '+' : '-'} {formatBRL(t.amount)}
                </span>
                <span className="block text-[10px] font-bold uppercase text-slate-400">{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleAddTransaction} className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border space-y-4 text-xs">
            <h3 className="font-bold text-base">Novo Lançamento Financeiro</h3>

            <div>
              <label className="block font-semibold mb-1">Descrição</label>
              <input
                type="text"
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Pagamento conta de energia, Compra de Shampoo"
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Tipo</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 border rounded-xl">
                  <option value="despesa">Despesa (-)</option>
                  <option value="receita">Receita (+)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-xl">
                Cancelar
              </button>
              <button type="submit" className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold">
                Salvar Lançamento
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
