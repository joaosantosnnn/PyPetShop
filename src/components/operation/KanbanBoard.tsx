import React from 'react';
import { usePetGestor } from '../../context/AppContext';
import { AppointmentStatus, Appointment } from '../../types';
import { formatTime } from '../../utils/formatters';
import { Scissors, AlertTriangle, ShieldAlert, Phone, Clock, ChevronRight, CheckCircle2, User } from 'lucide-react';
import { generateWhatsAppLink, buildPetReadyMessage } from '../../utils/whatsapp';

export const KanbanBoard: React.FC = () => {
  const { appointments, updateAppointmentStatus, setCurrentView } = usePetGestor();

  const columns: { id: AppointmentStatus; label: string; color: string }[] = [
    { id: 'aguardando', label: 'Aguardando', color: 'border-slate-300 bg-slate-100/50 text-slate-700' },
    { id: 'em_banho', label: 'Em Banho', color: 'border-cyan-300 bg-cyan-50/50 text-cyan-800' },
    { id: 'em_secagem', label: 'Em Secagem', color: 'border-amber-300 bg-amber-50/50 text-amber-800' },
    { id: 'em_tosa', label: 'Em Tosa', color: 'border-purple-300 bg-purple-50/50 text-purple-800' },
    { id: 'finalizando', label: 'Finalizando', color: 'border-teal-300 bg-teal-50/50 text-teal-800' },
    { id: 'pronto', label: 'Pronto p/ Entrega', color: 'border-emerald-400 bg-emerald-50 text-emerald-900' },
    { id: 'entregue', label: 'Entregue ao Tutor', color: 'border-slate-200 bg-slate-50 text-slate-500' },
  ];

  const handleNextStage = (app: Appointment) => {
    const stageOrder: AppointmentStatus[] = ['aguardando', 'em_banho', 'em_secagem', 'em_tosa', 'finalizando', 'pronto', 'entregue'];
    const currentIndex = stageOrder.indexOf(app.status);
    if (currentIndex !== -1 && currentIndex < stageOrder.length - 1) {
      updateAppointmentStatus(app.id, stageOrder[currentIndex + 1]);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scissors className="w-6 h-6 text-teal-600" />
            Painel Operacional de Banho e Tosa (Kanban)
          </h2>
          <p className="text-xs text-slate-500">
            Acompanhamento ao vivo de etapas dos animais no centro estético
          </p>
        </div>

        <button
          onClick={() => setCurrentView('appointments')}
          className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs"
        >
          Voltar para Agenda
        </button>
      </div>

      {/* Pipeline Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 overflow-x-auto pb-4 custom-scrollbar">
        {columns.map(col => {
          const colApps = appointments.filter(a => a.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between mb-3 shadow-2xs ${col.color}`}>
                <span>{col.label}</span>
                <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-center text-[10px]">
                  {colApps.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                {colApps.length === 0 ? (
                  <div className="h-28 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-[11px] text-slate-400 italic">
                    Nenhum pet nesta etapa
                  </div>
                ) : (
                  colApps.map(app => {
                    const waReadyLink = generateWhatsAppLink(
                      app.customer_phone || '',
                      buildPetReadyMessage(app.customer_name || 'Tutor', app.pet_name || 'Pet')
                    );

                    return (
                      <div
                        key={app.id}
                        className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition space-y-2 text-xs"
                      >
                        {/* Pet Photo & Header */}
                        <div className="flex items-center gap-2">
                          {app.pet_photo ? (
                            <img src={app.pet_photo} alt={app.pet_name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0">
                              {app.pet_name?.charAt(0)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 dark:text-white truncate">{app.pet_name}</h4>
                            <p className="text-[11px] text-slate-500 truncate">{app.customer_name}</p>
                          </div>
                        </div>

                        {/* Scheduled Time & Service */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg text-[11px] space-y-0.5">
                          <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span>Horário:</span> <span className="font-bold text-teal-600">{formatTime(app.scheduled_at)}</span>
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 truncate"><span className="font-semibold">Serviço:</span> {app.service_name}</p>
                          <p className="text-slate-500 truncate"><span className="font-semibold">Banhista:</span> {app.employee_name || 'Geral'}</p>
                        </div>

                        {/* Important Health / Aggression Alerts */}
                        {app.pet_allergies && (
                          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700 font-bold text-[10px] flex items-center gap-1 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                            <span className="truncate">Alergia: {app.pet_allergies}</span>
                          </div>
                        )}

                        {app.pet_aggression && app.pet_aggression >= 3 && (
                          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-800 font-bold text-[10px] flex items-center gap-1 border border-amber-200">
                            <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Atenção: Pet Reativo (Grau {app.pet_aggression})</span>
                          </div>
                        )}

                        {/* Stage Action Buttons */}
                        <div className="pt-1 flex items-center justify-between gap-1">
                          {app.status === 'pronto' ? (
                            <a
                              href={waReadyLink}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <Phone className="w-3 h-3" /> Avisar Tutor
                            </a>
                          ) : app.status !== 'entregue' ? (
                            <button
                              onClick={() => handleNextStage(app)}
                              className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition"
                            >
                              Avançar <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic mx-auto">Concluído</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
