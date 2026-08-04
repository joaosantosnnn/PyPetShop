import React, { useState } from 'react';
import { usePetGestor } from '../../context/AppContext';
import { Appointment, Pet } from '../../types';
import { formatBRL, formatDate, formatTime } from '../../utils/formatters';
import { AppointmentFormModal } from './AppointmentFormModal';
import { PortalRequestsPanel } from './PortalRequestsPanel';
import { generateWhatsAppLink, buildAppointmentReminderMessage, buildPetReadyMessage } from '../../utils/whatsapp';
import { 
  Calendar as CalendarIcon, Plus, Filter, Scissors, 
  Clock, CheckCircle, XCircle, Phone, Dog, User, AlertTriangle, ArrowRight, ClipboardList
} from 'lucide-react';

interface AppointmentsViewProps {
  initialPet?: Pet | null;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({ initialPet }) => {
  const { 
    appointments, addAppointment, updateAppointmentStatus, addServiceOrder, 
    allProfiles, setCurrentView 
  } = usePetGestor();

  const [viewMode, setViewMode] = useState<'diaria' | 'semanal' | 'mensal'>('diaria');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(Boolean(initialPet));
  const [cancelReasonModalApp, setCancelReasonModalApp] = useState<Appointment | null>(null);
  const [cancellationReasonText, setCancellationReasonText] = useState('');

  // Filtered appointments
  const filteredAppointments = appointments.filter(a => {
    if (selectedEmployeeFilter !== 'all' && a.employee_id !== selectedEmployeeFilter) {
      return false;
    }
    return true;
  });

  const handleGenerateComanda = async (app: Appointment) => {
    try {
      await addServiceOrder({
      appointment_id: app.id,
      customer_id: app.customer_id,
      customer_name: app.customer_name,
      pet_id: app.pet_id,
      pet_name: app.pet_name,
      status: 'aberta',
      items: [
        {
          id: 'item-1',
          service_order_id: '',
          type: 'service',
          item_id: app.service_id,
          name: app.service_name || 'Serviço Agendado',
          quantity: 1,
          unit_price: app.expected_price,
          total_price: app.expected_price,
          assigned_employee_id: app.employee_id,
        }
      ],
      subtotal: app.expected_price,
      discount: 0,
      total: app.expected_price,
      paid_amount: 0,
      tutor_signature_accepted: true,
      notes: app.notes,
      });
      setCurrentView('comandas');
    } catch {
      // O contexto exibe a mensagem detalhada.
    }
  };

  const handleConfirmCancel = () => {
    if (cancelReasonModalApp) {
      updateAppointmentStatus(cancelReasonModalApp.id, 'cancelado', cancellationReasonText || 'Cancelado pelo cliente');
      setCancelReasonModalApp(null);
      setCancellationReasonText('');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <PortalRequestsPanel />
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-teal-600" />
            Agenda de Banho & Tosa
          </h2>
          <p className="text-xs text-slate-500">
            Controle de horários, profissionais e comandas geradas
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" /> Agendar Atendimento
        </button>
      </div>

      {/* Controls Bar: View Modes & Staff Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* View Mode Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto justify-center">
          {(['diaria', 'semanal', 'mensal'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                viewMode === mode
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Visão {mode}
            </button>
          ))}
        </div>

        {/* Staff Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600 dark:text-slate-300">Profissional:</span>
          <select
            value={selectedEmployeeFilter}
            onChange={e => setSelectedEmployeeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="all">Todos os Profissionais</option>
            {allProfiles.map(p => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Nenhum agendamento encontrado para estes filtros.
          </div>
        ) : (
          filteredAppointments.map(app => {
            const reminderWaLink = generateWhatsAppLink(
              app.customer_phone || '',
              buildAppointmentReminderMessage(app.customer_name || 'Tutor', app.pet_name || 'Pet', formatDate(app.scheduled_at), app.service_name || 'Banho')
            );

            const isCancelled = app.status === 'cancelado';
            const isCompleted = app.status === 'entregue';

            return (
              <div
                key={app.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCancelled ? 'border-rose-200 bg-rose-50/20 opacity-70' :
                  isCompleted ? 'border-slate-200 opacity-80' :
                  'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Time & Pet Info */}
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 flex flex-col items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-teal-600 mb-0.5" />
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {formatTime(app.scheduled_at)}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {app.pet_name}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        app.status === 'pronto' ? 'bg-emerald-100 text-emerald-800' :
                        app.status === 'em_banho' || app.status === 'em_tosa' ? 'bg-amber-100 text-amber-800' :
                        app.status === 'cancelado' ? 'bg-rose-100 text-rose-800' :
                        'bg-teal-100 text-teal-800'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium">
                      Tutor: {app.customer_name} ({app.customer_phone || 'Sem tel'})
                    </p>

                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                      Serviço: <span className="text-teal-600 dark:text-teal-400">{app.service_name}</span> • {formatBRL(app.expected_price)}
                    </p>

                    {app.pet_allergies && (
                      <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Alergia: {app.pet_allergies}
                      </p>
                    )}
                  </div>
                </div>

                {/* Professional & Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 mr-2">
                    Profissional: <strong className="text-slate-800 dark:text-slate-200">{app.employee_name || 'Livre'}</strong>
                  </span>

                  {/* Actions according to status */}
                  {!isCancelled && !isCompleted && (
                    <>
                      <a
                        href={reminderWaLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1"
                        title="Enviar Lembrete WhatsApp"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                      </a>

                      <button
                        onClick={() => handleGenerateComanda(app)}
                        className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
                      >
                        <ClipboardList className="w-3.5 h-3.5" /> Gerar Comanda & Receber
                      </button>

                      <button
                        onClick={() => setCancelReasonModalApp(app)}
                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition"
                        title="Cancelar Agendamento"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cancellation Reason Modal */}
      {cancelReasonModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Cancelar Agendamento</h3>
            <p className="text-xs text-slate-500">Por favor, registre o motivo do cancelamento para o histórico:</p>
            <textarea
              rows={3}
              value={cancellationReasonText}
              onChange={e => setCancellationReasonText(e.target.value)}
              placeholder="Ex: Cliente desmarcou em cima da hora / Viagem / Imprevisto"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCancelReasonModalApp(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Form Modal */}
      <AppointmentFormModal
        isOpen={isModalOpen}
        initialPet={initialPet}
        onClose={() => setIsModalOpen(false)}
        onSave={addAppointment}
      />
    </div>
  );
};
