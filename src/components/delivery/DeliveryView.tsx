import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Dog, MapPin, Navigation, Phone, Plus, Truck, XCircle } from 'lucide-react';
import { usePetGestor } from '../../context/AppContext';
import { generateWhatsAppLink } from '../../utils/whatsapp';
import { formatBRL } from '../../utils/formatters';

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900';
const statusLabels = { pendente: 'Pendente', em_transito: 'Em trânsito', concluido: 'Concluído', cancelado: 'Cancelado' } as const;

export const DeliveryView: React.FC = () => {
  const { customers, pets, allProfiles, currentProfile, deliveryRequests, addDeliveryRequest, updateDeliveryStatus } = usePetGestor();
  const [showForm, setShowForm] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [petId, setPetId] = useState('');
  const [type, setType] = useState<'busca' | 'entrega' | 'ambos'>('ambos');
  const [address, setAddress] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [driverId, setDriverId] = useState('');
  const [fee, setFee] = useState(0);
  const [notes, setNotes] = useState('');

  const customerPets = useMemo(() => pets.filter(pet => pet.customer_id === customerId && pet.is_active), [pets, customerId]);
  const drivers = allProfiles.filter(profile => profile.is_active && ['proprietario', 'administrador', 'gerente', 'atendente'].includes(profile.role));

  const chooseCustomer = (id: string) => {
    setCustomerId(id); setPetId('');
    const customer = customers.find(item => item.id === id);
    if (customer) setAddress([customer.address, customer.number, customer.neighborhood, customer.city, customer.state].filter(Boolean).join(', '));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const customer = customers.find(item => item.id === customerId);
    const pet = pets.find(item => item.id === petId);
    const driver = allProfiles.find(item => item.id === driverId);
    if (!customer || !pet) return;
    addDeliveryRequest({ customer_id: customer.id, customer_name: customer.name, pet_id: pet.id, pet_name: pet.name, type, address, scheduled_at: new Date(scheduledAt).toISOString(), driver_id: driverId || undefined, driver_name: driver?.full_name, delivery_fee: fee, status: 'pendente', notes, created_by: currentProfile.id });
    setShowForm(false); setCustomerId(''); setPetId(''); setAddress(''); setScheduledAt(''); setDriverId(''); setFee(0); setNotes('');
  };

  const formatDate = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(value));

  return <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><h2 className="flex items-center gap-2 text-xl font-bold"><Truck className="h-6 w-6 text-teal-600" />Busca e entrega</h2><p className="text-xs text-slate-500">Controle de transportes, responsáveis, taxas e rotas dos pets.</p></div>
      <button onClick={() => setShowForm(value => !value)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700"><Plus className="h-4 w-4" />Novo transporte</button>
    </div>

    {showForm && <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
      <label className="text-sm font-medium">Tutor<select required className={`${fieldClass} mt-1`} value={customerId} onChange={event => chooseCustomer(event.target.value)}><option value="">Selecione</option>{customers.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="text-sm font-medium">Pet<select required disabled={!customerId} className={`${fieldClass} mt-1`} value={petId} onChange={event => setPetId(event.target.value)}><option value="">Selecione</option>{customerPets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label className="text-sm font-medium">Tipo<select className={`${fieldClass} mt-1`} value={type} onChange={event => setType(event.target.value as typeof type)}><option value="busca">Busca</option><option value="entrega">Entrega</option><option value="ambos">Busca e entrega</option></select></label>
      <label className="text-sm font-medium md:col-span-2">Endereço<input required className={`${fieldClass} mt-1`} value={address} onChange={event => setAddress(event.target.value)} /></label>
      <label className="text-sm font-medium">Data e hora<input required type="datetime-local" className={`${fieldClass} mt-1`} value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} /></label>
      <label className="text-sm font-medium">Responsável<select className={`${fieldClass} mt-1`} value={driverId} onChange={event => setDriverId(event.target.value)}><option value="">A definir</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}</select></label>
      <label className="text-sm font-medium">Taxa<input min={0} step="0.01" type="number" className={`${fieldClass} mt-1`} value={fee} onChange={event => setFee(Number(event.target.value))} /></label>
      <label className="text-sm font-medium">Observações<input className={`${fieldClass} mt-1`} value={notes} onChange={event => setNotes(event.target.value)} /></label>
      <div className="flex justify-end gap-2 md:col-span-2 lg:col-span-3"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2.5 text-sm font-bold">Cancelar</button><button className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white">Agendar transporte</button></div>
    </form>}

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{deliveryRequests.length === 0 ? <div className="col-span-full rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">Nenhuma busca ou entrega agendada.</div> : deliveryRequests.map(request => {
      const customer = customers.find(item => item.id === request.customer_id);
      const waLink = generateWhatsAppLink(customer?.whatsapp || customer?.phone || '', `Olá ${request.customer_name}! O transporte do pet ${request.pet_name} está com status: ${statusLabels[request.status]}.`);
      return <article key={request.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Dog className="h-5 w-5 text-teal-600" /><h3 className="font-bold">{request.pet_name}</h3></div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-800">{statusLabels[request.status]}</span></div>
        <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/50"><p className="font-semibold">Tutor: {request.customer_name}</p><p className="flex gap-1 text-slate-600 dark:text-slate-400"><MapPin className="h-4 w-4 shrink-0 text-rose-500" />{request.address}</p><p className="flex gap-1"><Clock className="h-4 w-4 text-teal-600" />{formatDate(request.scheduled_at)}</p><p>Responsável: {request.driver_name || 'A definir'} · Taxa: {formatBRL(request.delivery_fee)}</p></div>
        <div className="grid grid-cols-2 gap-2"><a href={waLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white"><Phone className="h-3.5 w-3.5" />WhatsApp</a><a href={`https://maps.google.com/?q=${encodeURIComponent(request.address)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded-xl border py-2 text-xs font-bold"><Navigation className="h-4 w-4 text-teal-600" />Mapa</a></div>
        {request.status === 'pendente' && <button onClick={() => updateDeliveryStatus(request.id, 'em_transito')} className="w-full rounded-xl bg-blue-600 py-2 text-xs font-bold text-white">Iniciar transporte</button>}
        {request.status === 'em_transito' && <div className="grid grid-cols-2 gap-2"><button onClick={() => updateDeliveryStatus(request.id, 'concluido')} className="flex items-center justify-center gap-1 rounded-xl bg-teal-600 py-2 text-xs font-bold text-white"><CheckCircle2 className="h-4 w-4" />Concluir</button><button onClick={() => updateDeliveryStatus(request.id, 'cancelado')} className="flex items-center justify-center gap-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white"><XCircle className="h-4 w-4" />Cancelar</button></div>}
      </article>;
    })}</div>
  </div>;
};
