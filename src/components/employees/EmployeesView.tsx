import React, { useState } from 'react';
import { usePetGestor } from '../../context/AppContext';
import { formatBRL, formatDate } from '../../utils/formatters';
import { Users, DollarSign, Award, Percent, Phone, Mail, ShieldCheck } from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const { allProfiles, sales, appointments, serviceOrders } = usePetGestor();

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600" />
            Equipe, Tosadores & Comissões
          </h2>
          <p className="text-xs text-slate-500">
            Controle de profissionais, taxas de comissão acumuladas e extrato de repasses
          </p>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allProfiles.map(emp => {
          // Calculate total service orders performed by employee
          const empOrders = serviceOrders.filter(so => 
            so.items.some(i => i.assigned_employee_id === emp.id)
          );

          const estimatedCommission = empOrders.reduce((acc, so) => acc + (so.total * ((emp.commission_rate || 15) / 100)), 0);

          return (
            <div
              key={emp.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200 font-bold text-lg flex items-center justify-center shrink-0">
                  {emp.full_name.charAt(0)}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {emp.full_name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {emp.role}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Taxa de Comissão:</span>
                  <span className="font-bold text-teal-600">{emp.commission_rate || 15}%</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Atendimentos Concluídos:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{empOrders.length}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1 border-t">
                  <span className="font-bold">Comissão a Pagar:</span>
                  <span className="font-black text-emerald-600 text-sm">{formatBRL(estimatedCommission)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {emp.phone || 'Telefone não informado'}</p>
                <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {emp.email}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
