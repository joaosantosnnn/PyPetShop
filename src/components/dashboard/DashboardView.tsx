import React from 'react';
import { usePetGestor } from '../../context/AppContext';
import { formatBRL, formatDate, formatTime } from '../../utils/formatters';
import { 
  DollarSign, ShoppingBag, Calendar, Scissors, CheckCircle, 
  AlertTriangle, Package, TrendingUp, TrendingDown, ArrowUpRight, 
  Plus, Users, Sparkles, Clock, ChevronRight, Phone
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { generateWhatsAppLink, buildPetReadyMessage } from '../../utils/whatsapp';

interface DashboardViewProps {
  onOpenNewAppointment: () => void;
  onOpenNewSale: () => void;
  onOpenNewCustomer: () => void;
  onOpenNewExpense: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewAppointment,
  onOpenNewSale,
  onOpenNewCustomer,
  onOpenNewExpense,
}) => {
  const { 
    appointments, sales, financialTransactions, 
    products, setCurrentView, updateAppointmentStatus 
  } = usePetGestor();

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculations
  const todaySales = sales.filter(s => s.created_at.startsWith(todayStr) && s.status === 'concluida');
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);

  const monthRevenue = sales
    .filter(s => s.status === 'concluida')
    .reduce((sum, s) => sum + s.total, 0);

  const todayAppointments = appointments.filter(a => a.scheduled_at.startsWith(todayStr) || true); // All active
  const inServicePets = appointments.filter(a => ['em_banho', 'em_secagem', 'em_tosa', 'finalizando'].includes(a.status));
  const readyPets = appointments.filter(a => a.status === 'pronto');

  const accountsPayableDue = financialTransactions.filter(t => t.type === 'despesa' && t.status === 'pendente');
  const accountsReceivable = financialTransactions.filter(t => t.type === 'receita' && t.status === 'pendente');

  const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock);
  const expiringProducts = products.filter(p => p.expiration_date && new Date(p.expiration_date).getTime() - Date.now() < 30 * 86400000);

  // Chart Data Preparation (Mock 7-day revenue/expense trend)
  const chartData = [
    { day: 'Seg', receita: 1200, despesa: 400 },
    { day: 'Ter', receita: 1850, despesa: 620 },
    { day: 'Qua', receita: 1400, despesa: 300 },
    { day: 'Qui', receita: 2100, despesa: 800 },
    { day: 'Sex', receita: 2900, despesa: 1100 },
    { day: 'Sáb', receita: 3800, despesa: 950 },
    { day: 'Dom', receita: 1600, despesa: 200 },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Quick Actions Shortcuts Banner */}
      <div className="bg-slate-900 rounded-xl p-6 text-white shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl font-bold tracking-tight">Painel Operacional PetGestor</h2>
          <p className="text-slate-400 text-sm mt-1">
            Visão central de vendas, agendamentos, estoque e atendimento em tempo real.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={onOpenNewAppointment}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Novo Agendamento
          </button>
          <button
            onClick={onOpenNewSale}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <ShoppingBag className="w-4 h-4" /> Nova Venda PDV
          </button>
          <button
            onClick={onOpenNewCustomer}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
          >
            <Users className="w-4 h-4 text-teal-400" /> Novo Cliente
          </button>
          <button
            onClick={onOpenNewExpense}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg text-xs font-semibold border border-rose-900/40 transition"
          >
            <DollarSign className="w-4 h-4 text-rose-400" /> Nova Despesa
          </button>
        </div>
      </div>

      {/* Top Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Faturamento Hoje
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
              {formatBRL(todayRevenue)}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> {todaySales.length} vendas realizadas hoje
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Month Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Faturamento do Mês
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
              {formatBRL(monthRevenue)}
            </p>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Metas em dia
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Pets in Service */}
        <div 
          onClick={() => setCurrentView('operation')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-teal-500 transition-colors"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Em Atendimento
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
              {inServicePets.length} <span className="text-sm font-normal text-slate-500">pets</span>
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
              Banho, Secagem e Tosa
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900">
            <Scissors className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Pets Ready for Delivery */}
        <div 
          onClick={() => setCurrentView('operation')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-teal-500 transition-colors"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Prontos p/ Entrega
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
              {readyPets.length} <span className="text-sm font-normal text-slate-500">pets</span>
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Aguardando tutores
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Graph & Financial Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Flow Graph */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Fluxo de Caixa Semanal (Receitas vs Despesas)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhamento gráfico dos últimos 7 dias
              </p>
            </div>
            <button
              onClick={() => setCurrentView('financial')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              Ver Detalhes <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  formatter={(val: any) => [formatBRL(Number(val)), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Area type="monotone" dataKey="receita" stroke="#0d9488" fillOpacity={1} fill="url(#colorReceita)" name="Receita" />
                <Area type="monotone" dataKey="despesa" stroke="#f43f5e" fillOpacity={1} fill="url(#colorDespesa)" name="Despesa" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Alerts & Accounts Due */}
        <div className="space-y-4">
          {/* Low Stock Alert Box */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Alertas de Estoque ({lowStockProducts.length})
              </h4>
              <button onClick={() => setCurrentView('products')} className="text-xs text-teal-600 font-semibold">
                Ver Todos
              </button>
            </div>
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Todos os estoques em nível adequado.</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 3).map(prod => (
                  <div key={prod.id} className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{prod.name}</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                        Atual: {prod.current_stock} {prod.unit} (Mín: {prod.min_stock})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accounts Payable Pending */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-rose-500" />
                Contas a Pagar ({accountsPayableDue.length})
              </h4>
              <button onClick={() => setCurrentView('financial')} className="text-xs text-teal-600 font-semibold">
                Financeiro
              </button>
            </div>
            {accountsPayableDue.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhuma conta pendente de vencimento.</p>
            ) : (
              <div className="space-y-2">
                {accountsPayableDue.slice(0, 3).map(item => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{item.description}</p>
                      <p className="text-[11px] text-slate-500">Venc: {formatDate(item.due_date)}</p>
                    </div>
                    <span className="font-bold text-rose-600">{formatBRL(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Schedule & Ready Pets Actions */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              Agenda do Dia & Atendimentos
            </h3>
            <p className="text-xs text-slate-500">Acompanhamento e envio direto de mensagens via WhatsApp para tutores</p>
          </div>
          <button 
            onClick={() => setCurrentView('appointments')}
            className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-xs hover:bg-teal-100 transition"
          >
            Abrir Agenda Completa
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-bold text-slate-400">
                <th className="py-2.5 px-3">Horário</th>
                <th className="py-2.5 px-3">Pet / Tutor</th>
                <th className="py-2.5 px-3">Serviço</th>
                <th className="py-2.5 px-3">Profissional</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Ação WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {todayAppointments.map(app => {
                const isReady = app.status === 'pronto';
                const waLink = generateWhatsAppLink(
                  app.customer_phone || '11999999999',
                  buildPetReadyMessage(app.customer_name || 'Tutor', app.pet_name || 'Pet')
                );

                return (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatTime(app.scheduled_at)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {app.pet_photo ? (
                          <img src={app.pet_photo} alt={app.pet_name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                            {app.pet_name?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{app.pet_name}</p>
                          <p className="text-[11px] text-slate-500">{app.customer_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                      {app.service_name}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {app.employee_name || 'Não atribuído'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                        app.status === 'pronto' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        app.status === 'em_banho' || app.status === 'em_tosa' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        app.status === 'entregue' ? 'bg-slate-100 text-slate-600' :
                        'bg-teal-100 text-teal-800'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isReady ? (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition"
                        >
                          <Phone className="w-3.5 h-3.5" /> Avisar Tutor
                        </a>
                      ) : (
                        <button
                          onClick={() => updateAppointmentStatus(app.id, 'pronto')}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-[11px]"
                        >
                          Marcar Pronto
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
