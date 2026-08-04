import React, { useState } from 'react';
import { usePetGestor } from '../../context/AppContext';
import { PetIncident, LiabilityTerm } from '../../types';
import { formatDate } from '../../utils/formatters';
import { FileText, AlertTriangle, ShieldCheck, Plus, CheckCircle, Dog, User } from 'lucide-react';

export const TermsView: React.FC = () => {
  const { pets, customers, petIncidents, addIncident } = usePetGestor();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || '');
  const [incidentType, setIncidentType] = useState<any>('no_severo');
  const [description, setDescription] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');

  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPet = pets.find(p => p.id === selectedPetId);

    addIncident({
      pet_id: selectedPetId,
      pet_name: selectedPet?.name || '',
      customer_id: selectedPet?.customer_id || '',
      type: incidentType,
      description,
      actions_taken: actionsTaken,
      notified_tutor: true,
      logged_at: new Date().toISOString(),
    });
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600" />
            Termos de Responsabilidade & Registro de Incidentes
          </h2>
          <p className="text-xs text-slate-500">
            Documentação legal para nós severos, lesões pré-existentes e reações alérgicas
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" /> Registrar Incidente / Ocorrência
        </button>
      </div>

      {/* Standard Terms List */}
      <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 space-y-3 text-xs">
        <h3 className="font-bold text-teal-900 dark:text-teal-200 text-sm flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          Modelo Padrão de Autorização para Remoção de Nós Severos
        </h3>
        <p className="text-teal-800 dark:text-teal-300 leading-relaxed">
          "Pelo presente termo, autorizo o PetGestor a realizar o procedimento de desembolo / tricotomia para remoção de pelagem emaranhada.
          Reconheço que a pelagem com nós severos impede a ventilação cutânea e pode encobrir lesões, dermatites ou otites pré-existentes."
        </p>
      </div>

      {/* Incidents Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-sm">
          Ocorrências e Incidentes Gravados
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {petIncidents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic">Nenhum incidente gravado.</div>
          ) : (
            petIncidents.map(inc => (
              <div key={inc.id} className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      Pet: {inc.pet_name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                      {inc.type.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300"><span className="font-semibold">Descrição:</span> {inc.description}</p>
                  {inc.actions_taken && <p className="text-slate-500"><span className="font-semibold">Ação tomada:</span> {inc.actions_taken}</p>}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400">{formatDate(inc.logged_at)}</span>
                  <span className="block text-emerald-600 font-bold text-[10px] mt-1">[Tutor Notificado]</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleAddIncident} className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border space-y-4 text-xs">
            <h3 className="font-bold text-base">Registrar Incidente</h3>

            <div>
              <label className="block font-semibold mb-1">Pet</label>
              <select value={selectedPetId} onChange={e => setSelectedPetId(e.target.value)} className="w-full px-3 py-2 border rounded-xl">
                {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.customer_name})</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Tipo de Ocorrência</label>
              <select value={incidentType} onChange={e => setIncidentType(e.target.value)} className="w-full px-3 py-2 border rounded-xl">
                <option value="no_severo">Nós Severos / Pelagem Emaranhada</option>
                <option value="lesao_preexistente">Lesão Pré-existente na Pele / Ouvido</option>
                <option value="comportamento_agressivo">Tentativa de Morder / Agressividade</option>
                <option value="vermelhidao_pos_tosa">Vermelhidão / Sensibilidade Pós-Tosa</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Descrição Detalhada</label>
              <textarea rows={2} required value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
            </div>

            <div>
              <label className="block font-semibold mb-1">Ação Tomada</label>
              <input type="text" value={actionsTaken} onChange={e => setActionsTaken(e.target.value)} placeholder="Ex: Avisado tutor por WhatsApp e aplicado pomada soothing" className="w-full px-3 py-2 border rounded-xl" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-xl">Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold">Gravar Incidente</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
