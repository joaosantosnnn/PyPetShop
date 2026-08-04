import React from 'react';
import { usePetGestor } from '../../context/AppContext';
import { Truck, MapPin, Phone, Clock, CheckCircle2, Dog, Navigation } from 'lucide-react';
import { generateWhatsAppLink } from '../../utils/whatsapp';

export const DeliveryView: React.FC = () => {
  const { appointments, updateAppointmentStatus } = usePetGestor();

  const deliveryApps = appointments.filter(a => a.needs_pickup_delivery);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-teal-600" />
            Táxi Dog & Logística de Entregas
          </h2>
          <p className="text-xs text-slate-500">
            Controle de rotas de busca e devolução de animais no domicílio do tutor
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deliveryApps.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Nenhuma busca ou entrega de Táxi Dog agendada para hoje.
          </div>
        ) : (
          deliveryApps.map(app => {
            const waLink = generateWhatsAppLink(
              app.customer_phone || '',
              `Olá ${app.customer_name}! Nosso motorista do Táxi Dog está a caminho para buscar/entregar o pet ${app.pet_name}.`
            );

            return (
              <div
                key={app.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dog className="w-5 h-5 text-teal-600" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {app.pet_name}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                    {app.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5 text-xs">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Tutor: {app.customer_name}</p>
                  <p className="text-slate-600 dark:text-slate-400 flex items-start gap-1">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{app.pickup_address || 'Endereço cadastrado na ficha do tutor'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" /> Avisar no WhatsApp
                  </a>

                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(app.pickup_address || '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 text-xs"
                    title="Abrir no Google Maps"
                  >
                    <Navigation className="w-4 h-4 text-teal-600" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
