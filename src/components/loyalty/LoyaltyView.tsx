import React, { useState } from 'react';
import { usePetGestor } from '../../context/AppContext';
import { LoyaltyPackage, StampCard } from '../../types';
import { formatBRL, formatDate } from '../../utils/formatters';
import { Award, Plus, CheckCircle, Clock, Gift, Sparkles } from 'lucide-react';

export const LoyaltyView: React.FC = () => {
  const { customers, pets, loyaltyPackages, addLoyaltyPackage } = usePetGestor();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || '');
  const [packageName, setPackageName] = useState('Pacote Mensal 4 Banhos');
  const [totalBaths, setTotalBaths] = useState(4);
  const [pricePaid, setPricePaid] = useState(200);

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomerId);
    const pet = pets.find(p => p.id === selectedPetId);

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 30);

    addLoyaltyPackage({
      customer_id: selectedCustomerId,
      customer_name: cust?.name || '',
      pet_id: selectedPetId,
      pet_name: pet?.name || '',
      package_name: packageName,
      total_baths: Number(totalBaths),
      used_baths: 0,
      price_paid: Number(pricePaid),
      expiration_date: expDate.toISOString(),
      status: 'ativo',
    });
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-teal-600" />
            Pacotes Mensais & Cartão Fidelidade
          </h2>
          <p className="text-xs text-slate-500">
            Assinaturas de banho recorrentes, controle de saldo e prazos de validade
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" /> Vender Novo Pacote
        </button>
      </div>

      {/* Packages Active List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loyaltyPackages.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Nenhum pacote mensal de banhos ativo.
          </div>
        ) : (
          loyaltyPackages.map(pkg => {
            const remaining = pkg.total_baths - pkg.used_baths;

            return (
              <div
                key={pkg.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {pkg.package_name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    {pkg.status}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1 text-xs">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Pet: {pkg.pet_name}</p>
                  <p className="text-slate-600 dark:text-slate-400">Tutor: {pkg.customer_name}</p>
                  <p className="text-slate-500 text-[11px]">Validade: {formatDate(pkg.expiration_date)}</p>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Banhos Utilizados</span>
                    <span className="text-teal-600">{pkg.used_baths} de {pkg.total_baths} ({remaining} restantes)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-600 h-full transition-all"
                      style={{ width: `${(pkg.used_baths / pkg.total_baths) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Package Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleCreatePackage} className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border space-y-4 text-xs">
            <h3 className="font-bold text-base">Vender Pacote de Banhos</h3>

            <div>
              <label className="block font-semibold mb-1">Cliente / Tutor</label>
              <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className="w-full px-3 py-2 border rounded-xl">
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Pet Beneficiário</label>
              <select value={selectedPetId} onChange={e => setSelectedPetId(e.target.value)} className="w-full px-3 py-2 border rounded-xl">
                {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.customer_name})</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Nome do Pacote</label>
              <input type="text" value={packageName} onChange={e => setPackageName(e.target.value)} className="w-full px-3 py-2 border rounded-xl font-bold" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Qtde de Banhos</label>
                <input type="number" value={totalBaths} onChange={e => setTotalBaths(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl font-bold" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Preço Total (R$)</label>
                <input type="number" value={pricePaid} onChange={e => setPricePaid(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl font-bold text-teal-600" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-xl">Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold">Confirmar Pacote</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
