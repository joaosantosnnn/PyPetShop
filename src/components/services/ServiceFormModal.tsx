import React, { useState } from 'react';
import { Service } from '../../types';
import { X, Sparkles, DollarSign, Clock, Percent } from 'lucide-react';

interface ServiceFormModalProps {
  isOpen: boolean;
  service?: Service | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  service,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(service?.name || '');
  const [description, setDescription] = useState(service?.description || '');
  const [category, setCategory] = useState(service?.category || 'Banho e Tosa');
  const [estimatedDuration, setEstimatedDuration] = useState(service?.estimated_duration_minutes || 45);
  const [basePrice, setBasePrice] = useState(service?.base_price || 60);
  const [priceSmall, setPriceSmall] = useState(service?.price_small || 50);
  const [priceMedium, setPriceMedium] = useState(service?.price_medium || 70);
  const [priceLarge, setPriceLarge] = useState(service?.price_large || 95);
  const [commissionPercentage, setCommissionPercentage] = useState(service?.commission_percentage || 15);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...(service || {}),
      name,
      description,
      category,
      estimated_duration_minutes: Number(estimatedDuration),
      base_price: Number(basePrice),
      price_small: Number(priceSmall),
      price_medium: Number(priceMedium),
      price_large: Number(priceLarge),
      commission_percentage: Number(commissionPercentage),
      is_active: service?.is_active ?? true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden my-8">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {service ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <p className="text-xs text-slate-500">Configuração de preço por porte e comissão do profissional</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome do Serviço *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Banho Completo, Tosa Higiênica, Hidratação"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Banho">Banho</option>
                <option value="Banho e Tosa">Banho e Tosa</option>
                <option value="Tosa Especial">Tosa Especial</option>
                <option value="Tratamentos">Tratamentos / Estética</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duração Estimada (minutos)
              </label>
              <input
                type="number"
                value={estimatedDuration}
                onChange={e => setEstimatedDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <p className="font-bold text-slate-900 dark:text-white">Tabela de Preço por Porte (R$)</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-500 mb-1">Pequeno (&lt;10kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={priceSmall}
                  onChange={e => setPriceSmall(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Médio (10-25kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={priceMedium}
                  onChange={e => setPriceMedium(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Grande (&gt;25kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={priceLarge}
                  onChange={e => setPriceLarge(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preço Base (Padrão R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={basePrice}
                onChange={e => setBasePrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Comissão do Profissional (%)
              </label>
              <input
                type="number"
                step="1"
                value={commissionPercentage}
                onChange={e => setCommissionPercentage(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição Detalhada do Serviço
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md"
            >
              Salvar Serviço
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
