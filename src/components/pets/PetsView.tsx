import React, { useState } from 'react';
import { usePetGestor } from '../../context/AppContext';
import { Pet, PetSpecies } from '../../types';
import { PetFormModal } from './PetFormModal';
import { 
  Dog, Search, Plus, AlertTriangle, ShieldAlert, 
  Calendar, Edit3, Heart, Weight, User, Phone, Sparkles, ChevronRight
} from 'lucide-react';

interface PetsViewProps {
  onOpenNewAppointmentWithPet?: (pet: Pet) => void;
}

export const PetsView: React.FC<PetsViewProps> = ({ onOpenNewAppointmentWithPet }) => {
  const { pets, customers, addPet, updatePet, setCurrentView } = usePetGestor();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  // Filtered pets
  const filteredPets = pets.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(term) ||
      (p.breed && p.breed.toLowerCase().includes(term)) ||
      (p.customer_name && p.customer_name.toLowerCase().includes(term));

    const matchesSpecies = selectedSpecies === 'all' || p.species === selectedSpecies;
    return matchesSearch && matchesSpecies;
  });

  const handleSavePet = (data: any) => {
    if (editingPet) {
      updatePet(data);
    } else {
      addPet(data);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Dog className="w-6 h-6 text-teal-600" />
            Prontuário de Animais & Pets
          </h2>
          <p className="text-xs text-slate-500">
            Total de {pets.length} animais cadastrados no sistema
          </p>
        </div>

        <button
          onClick={() => {
            setEditingPet(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" /> Cadastrar Pet
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do pet, raça ou tutor..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Species Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'cao', label: 'Cães' },
            { id: 'gato', label: 'Gatos' },
            { id: 'ave', label: 'Aves' },
            { id: 'roedor', label: 'Roedores' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedSpecies(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedSpecies === tab.id
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPets.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Nenhum pet localizado com os filtros atuais.
          </div>
        ) : (
          filteredPets.map(pet => {
            const hasAllergies = Boolean(pet.allergies);
            const isAggressive = pet.temperament === 'agressivo' || pet.aggression_level >= 3;

            return (
              <div
                key={pet.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Photo & Basic Info */}
                  <div className="flex items-start gap-3 mb-3">
                    {pet.photo_url ? (
                      <img
                        src={pet.photo_url}
                        alt={pet.name}
                        className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-black text-xl flex items-center justify-center shrink-0">
                        {pet.name.charAt(0)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                          {pet.name}
                        </h3>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {pet.size_category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 truncate">
                        {pet.breed || pet.species} • {pet.gender === 'macho' ? 'Macho' : 'Fêmea'}
                      </p>

                      <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-1 flex items-center gap-1 truncate">
                        <User className="w-3 h-3" /> Tutor: {pet.customer_name || 'Desconhecido'}
                      </p>
                    </div>
                  </div>

                  {/* Badges for Allergies and Aggression Warnings */}
                  <div className="space-y-1.5 my-3">
                    {hasAllergies && (
                      <div className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">Alergia: {pet.allergies}</span>
                      </div>
                    )}

                    {isAggressive && (
                      <div className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Atenção: Comportamento Agitado/Agressivo</span>
                      </div>
                    )}

                    {!hasAllergies && !isAggressive && (
                      <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                        Temperamento dócil • Sem restrições
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Peso:</span> {pet.weight} kg</p>
                    {pet.special_cares && <p className="truncate"><span className="font-semibold text-slate-700 dark:text-slate-300">Cuidado:</span> {pet.special_cares}</p>}
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setEditingPet(pet);
                      setIsModalOpen(true);
                    }}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenNewAppointmentWithPet) {
                        onOpenNewAppointmentWithPet(pet);
                      } else {
                        setCurrentView('appointments');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Agendar Banho
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pet Form Modal */}
      <PetFormModal
        isOpen={isModalOpen}
        pet={editingPet}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePet}
      />
    </div>
  );
};
