import React, { useState } from 'react';
import { usePetGestor } from '../../context/AppContext';
import { Service } from '../../types';
import { formatBRL } from '../../utils/formatters';
import { ServiceFormModal } from './ServiceFormModal';
import { Sparkles, Plus, Clock, Edit3, Percent, DollarSign } from 'lucide-react';

export const ServicesView: React.FC = () => {
  const { services, addService, updateService } = usePetGestor();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const handleSaveService = (data: any) => {
    if (editingService) {
      updateService(data);
    } else {
      addService(data);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-teal-600" />
            Catálogo de Serviços de Banho & Tosa
          </h2>
          <p className="text-xs text-slate-500">
            Tabela de preços por porte, duração estimada e taxa de comissão
          </p>
        </div>

        <button
          onClick={() => {
            setEditingService(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" /> Cadastrar Serviço
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(service => (
          <div
            key={service.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {service.category}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5" /> {service.estimated_duration_minutes} min
                </span>
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {service.name}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {service.description || 'Sem descrição.'}
              </p>

              {/* Price Tier Table */}
              <div className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <p className="font-bold text-slate-700 dark:text-slate-300">Preços por Porte:</p>
                <div className="grid grid-cols-3 gap-1 text-[11px] text-center">
                  <div className="p-1 rounded bg-white dark:bg-slate-700">
                    <span className="block text-[10px] text-slate-400">Pequeno</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{formatBRL(service.price_small || service.base_price)}</span>
                  </div>
                  <div className="p-1 rounded bg-white dark:bg-slate-700">
                    <span className="block text-[10px] text-slate-400">Médio</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{formatBRL(service.price_medium || service.base_price)}</span>
                  </div>
                  <div className="p-1 rounded bg-white dark:bg-slate-700">
                    <span className="block text-[10px] text-slate-400">Grande</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{formatBRL(service.price_large || service.base_price)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Comissão do Profissional:</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{service.commission_percentage}%</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Preço Base</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{formatBRL(service.base_price)}</span>
              </div>

              <button
                onClick={() => {
                  setEditingService(service);
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      <ServiceFormModal
        key={`${isModalOpen}-${editingService?.id || 'novo'}`}
        isOpen={isModalOpen}
        service={editingService}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveService}
      />
    </div>
  );
};
