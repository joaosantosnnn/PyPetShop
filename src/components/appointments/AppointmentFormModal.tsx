import React, { useState } from 'react';
import { Appointment, Pet } from '../../types';
import { usePetGestor } from '../../context/AppContext';
import { formatBRL } from '../../utils/formatters';
import { X, Calendar, Clock, User, Dog, Sparkles, MapPin, AlertTriangle } from 'lucide-react';

interface AppointmentFormModalProps {
  isOpen: boolean;
  initialPet?: Pet | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({
  isOpen,
  initialPet,
  onClose,
  onSave,
}) => {
  const { customers, pets, services, allProfiles, appointments } = usePetGestor();

  if (!isOpen) return null;

  const [selectedPetId, setSelectedPetId] = useState(initialPet?.id || (pets[0]?.id || ''));
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(allProfiles.find(p => p.role === 'tosador')?.id || allProfiles[0]?.id || '');
  
  // Date & Time
  const nowStr = new Date().toISOString().slice(0, 16);
  const [scheduledAt, setScheduledAt] = useState(nowStr);
  
  const [needsPickupDelivery, setNeedsPickupDelivery] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [notes, setNotes] = useState('');

  const selectedPet = pets.find(p => p.id === selectedPetId);
  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedCustomer = customers.find(c => c.id === selectedPet?.customer_id);

  // Price auto calculation based on pet size
  let calculatedPrice = selectedService?.base_price || 60;
  if (selectedPet && selectedService) {
    if (selectedPet.size_category === 'pequeno' && selectedService.price_small) calculatedPrice = selectedService.price_small;
    if (selectedPet.size_category === 'medio' && selectedService.price_medium) calculatedPrice = selectedService.price_medium;
    if (selectedPet.size_category === 'grande' && selectedService.price_large) calculatedPrice = selectedService.price_large;
  }

  const [customPrice, setCustomPrice] = useState<number | ''>('');
  const finalPrice = customPrice !== '' ? Number(customPrice) : calculatedPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetId || !selectedServiceId) return;

    const employee = allProfiles.find(p => p.id === selectedEmployeeId);

    onSave({
      customer_id: selectedCustomer?.id || selectedPet?.customer_id || '',
      customer_name: selectedCustomer?.name || 'Tutor',
      customer_phone: selectedCustomer?.phone || '',
      pet_id: selectedPetId,
      pet_name: selectedPet?.name || 'Pet',
      pet_photo: selectedPet?.photo_url || '',
      pet_species: selectedPet?.species || 'cao',
      pet_allergies: selectedPet?.allergies || '',
      pet_aggression: selectedPet?.aggression_level || 1,
      service_id: selectedServiceId,
      service_name: selectedService?.name || 'Serviço',
      employee_id: selectedEmployeeId,
      employee_name: employee?.full_name || '',
      scheduled_at: new Date(scheduledAt).toISOString(),
      estimated_duration_minutes: selectedService?.estimated_duration_minutes || 45,
      expected_price: finalPrice,
      status: 'agendado',
      needs_pickup_delivery: needsPickupDelivery,
      pickup_address: pickupAddress || selectedCustomer?.address || '',
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden my-8">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Novo Agendamento</h3>
              <p className="text-xs text-slate-500">Agendamento com verificação de disponibilidade e cálculo por porte</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Select Pet */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pet / Animal *
            </label>
            <select
              required
              value={selectedPetId}
              onChange={e => setSelectedPetId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            >
              {pets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.breed || p.species}) — Tutor: {p.customer_name}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Pet Alert Box */}
          {selectedPet && (selectedPet.allergies || selectedPet.temperament === 'agressivo') && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="font-bold">Aviso do Pet: </span>
                {selectedPet.allergies && `Alergia: ${selectedPet.allergies}. `}
                {selectedPet.temperament === 'agressivo' && 'Comportamento reativo/agressivo.'}
              </div>
            </div>
          )}

          {/* Service & Employee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Serviço Principal *
              </label>
              <select
                required
                value={selectedServiceId}
                onChange={e => setSelectedServiceId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatBRL(s.base_price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Banhista / Tosador
              </label>
              <select
                value={selectedEmployeeId}
                onChange={e => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {allProfiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date / Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data e Horário *
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preço Calculado / Ajustado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={customPrice !== '' ? customPrice : calculatedPrice}
                onChange={e => setCustomPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-teal-600"
              />
            </div>
          </div>

          {/* Taxi Dog Pickup */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pickup"
                checked={needsPickupDelivery}
                onChange={e => setNeedsPickupDelivery(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded-md"
              />
              <label htmlFor="pickup" className="font-bold text-slate-800 dark:text-slate-200">
                Necessita Busca e Entrega (Táxi Dog)
              </label>
            </div>

            {needsPickupDelivery && (
              <div>
                <label className="block text-slate-500 mb-1">Endereço de Coleta</label>
                <input
                  type="text"
                  value={pickupAddress || selectedCustomer?.address || ''}
                  onChange={e => setPickupAddress(e.target.value)}
                  placeholder="Endereço para busca do animal..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Tosa higiênica delicada, lacinho rosa, tutor busca às 17h"
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
              Confirmar Agendamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
