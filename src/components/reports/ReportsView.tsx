import React from 'react';
import { usePetGestor } from '../../context/AppContext';
import { formatBRL, exportToExcel } from '../../utils/formatters';
import { BarChart3, FileSpreadsheet, TrendingUp, Users, ShoppingBag, Award } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const ReportsView: React.FC = () => {
  const { customers, sales, appointments, serviceOrders, products } = usePetGestor();

  const totalSalesRevenue = sales.reduce((acc, s) => acc + s.total_amount, 0);
  const totalServicesRevenue = serviceOrders.filter(so => so.status === 'paga').reduce((acc, so) => acc + so.total, 0);

  const reportChartData = [
    { name: 'Loja / Produtos', faturamento: totalSalesRevenue },
    { name: 'Banho e Tosa', faturamento: totalServicesRevenue },
  ];

  const handleExportFullReport = () => {
    const data = [
      { Módulo: 'Vendas de Produtos', Total: totalSalesRevenue },
      { Módulo: 'Serviços de Banho/Tosa', Total: totalServicesRevenue },
      { Módulo: 'Total Acumulado', Total: totalSalesRevenue + totalServicesRevenue },
    ];
    exportToExcel(data, 'Relatorio_Geral_PetGestor');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-600" />
            Relatórios e Indicadores
          </h2>
          <p className="text-xs text-slate-500">
            Métricas de faturamento, vendas de produtos e serviços prestados
          </p>
        </div>

        <button
          onClick={handleExportFullReport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition"
        >
          <FileSpreadsheet className="w-4 h-4" /> Exportar Relatório Excel
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Faturamento Produtos</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatBRL(totalSalesRevenue)}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Faturamento Serviços</span>
          <div className="text-xl font-black text-teal-600 dark:text-teal-400 mt-1">{formatBRL(totalServicesRevenue)}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Total de Clientes</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{customers.length}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Itens em Estoque</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{products.length}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Composição de Faturamento por Origem</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(value: any) => formatBRL(Number(value))} />
              <Bar dataKey="faturamento" fill="#0d9488" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
