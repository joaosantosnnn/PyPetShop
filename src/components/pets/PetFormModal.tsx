import React, { useState } from 'react';
import { Pet, PetSpecies, PetGender, PetSize, PetTemperament } from '../../types';
import { usePetGestor } from '../../context/AppContext';
import { X, Dog, AlertTriangle, Shield, Heart, Upload } from 'lucide-react';

interface PetFormModalProps {
  isOpen: boolean;
  pet?: Pet | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const PetFormModal: React.FC<PetFormModalProps> = ({
  isOpen,
  pet,
  onClose,
  onSave,
}) => {
  const { customers } = usePetGestor();

  if (!isOpen) return null;

  const [customerId, setCustomerId] = useState(pet?.customer_id || (customers[0]?.id || ''));
  const [name, setName] = useState(pet?.name || '');
  const [photoUrl, setPhotoUrl] = useState(pet?.photo_url || '');
  const [species, setSpecies] = useState<PetSpecies>(pet?.species || 'cao');
  const [breed, setBreed] = useState(pet?.breed || '');
  const [gender, setGender] = useState<PetGender>(pet?.gender || 'macho');
  const [birthDate, setBirthDate] = useState(pet?.birth_date || '');
  const [approximateAge, setApproximateAge] = useState(pet?.approximate_age || '');
  const [weight, setWeight] = useState(pet?.weight || 5);
  const [sizeCategory, setSizeCategory] = useState<PetSize>(pet?.size_category || 'medio');
  const [color, setColor] = useState(pet?.color || '');
  const [isNeutered, setIsNeutered] = useState(pet?.is_neutered ?? false);
  const [allergies, setAllergies] = useState(pet?.allergies || '');
  const [diseases, setDiseases] = useState(pet?.diseases || '');
  const [medications, setMedications] = useState(pet?.medications || '');
  const [restrictions, setRestrictions] = useState(pet?.restrictions || '');
  const [temperament, setTemperament] = useState<PetTemperament>(pet?.temperament || 'calmo');
  const [aggressionLevel, setAggressionLevel] = useState(pet?.aggression_level || 1);
  const [specialCares, setSpecialCares] = useState(pet?.special_cares || '');
  const [vetName, setVetName] = useState(pet?.vet_name || '');
  const [vetPhone, setVetPhone] = useState(pet?.vet_phone || '');
  const [notes, setNotes] = useState(pet?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !customerId) return;

    const selectedCust = customers.find(c => c.id === customerId);

    onSave({
      ...(pet || {}),
      customer_id: customerId,
      customer_name: selectedCust?.name || '',
      name,
      photo_url: photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300&auto=format&fit=crop&q=80',
      species,
      breed,
      gender,
      birth_date: birthDate,
      approximate_age: approximateAge,
      weight: Number(weight),
      size_category: sizeCategory,
      color,
      is_neutered: isNeutered,
      allergies,
      diseases,
      medications,
      restrictions,
      temperament,
      aggression_level: Number(aggressionLevel),
      special_cares: specialCares,
      vet_name: vetName,
      vet_phone: vetPhone,
      notes,
      is_active: pet?.is_active ?? true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 rounded-xl">
              <Dog className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {pet ? 'Editar Pet / Animal' : 'Novo Pet / Animal'}
              </h3>
              <p className="text-xs text-slate-500">Prontuário técnico do animal com alertas de saúde e comportamento</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Tutor & Photo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tutor Responsável *
              </label>
              <select
                required
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone || 'Sem tel'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Pet *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Thor, Mel, Simba"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Species, Breed, Size, Weight */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Espécie
              </label>
              <select
                value={species}
                onChange={e => setSpecies(e.target.value as PetSpecies)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="cao">Cão (Cachorro)</option>
                <option value="gato">Gato</option>
                <option value="ave">Ave</option>
                <option value="roedor">Roedor</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Raça
              </label>
              <input
                type="text"
                value={breed}
                onChange={e => setBreed(e.target.value)}
                placeholder="Ex: Golden, Poodle, SRD"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sexo
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as PetGender)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="macho">Macho</option>
                <option value="femea">Fêmea</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Porte
              </label>
              <select
                value={sizeCategory}
                onChange={e => setSizeCategory(e.target.value as PetSize)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="pequeno">Pequeno (&lt;10kg)</option>
                <option value="medio">Médio (10-25kg)</option>
                <option value="grande">Grande (25-45kg)</option>
                <option value="gigante">Gigante (&gt;45kg)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Peso Atual (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={e => setWeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cor / Pelagem
              </label>
              <input
                type="text"
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder="Ex: Dourado, Branco, Caramelo"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="neutered"
                checked={isNeutered}
                onChange={e => setIsNeutered(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500"
              />
              <label htmlFor="neutered" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Animal Castrado
              </label>
            </div>
          </div>

          {/* Health & Behavior Warnings */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Alertas de Saúde & Temperamento
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alergias Conocidas
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                  placeholder="Ex: Lâmina quente, perfume, shampoo"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Temperamento / Comportamento
                </label>
                <select
                  value={temperament}
                  onChange={e => setTemperament(e.target.value as PetTemperament)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="docil">Dócil (Muito dócil e amigável)</option>
                  <option value="calmo">Calmo / Tranquilo</option>
                  <option value="agitado">Agitado / Brincante</option>
                  <option value="medroso">Medroso / Assustado</option>
                  <option value="agressivo">Agressivo (Requer fucinheira/cuidado)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cuidados Especiais no Banho / Secagem
                </label>
                <textarea
                  rows={2}
                  value={specialCares}
                  onChange={e => setSpecialCares(e.target.value)}
                  placeholder="Ex: Usar protetor auricular para soprador, cuidado com ouvidos delicados"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Photo & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                URL da Foto
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Veterinário Responsável
              </label>
              <input
                type="text"
                value={vetName}
                onChange={e => setVetName(e.target.value)}
                placeholder="Dr. Fernando (Clínica Vet)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition"
            >
              Salvar Pet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
