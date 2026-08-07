import React, { useEffect, useState } from 'react';
import { Building2, Clock, Image, Palette, Save } from 'lucide-react';
import { usePetGestor } from '../../context/AppContext';
import type { Company } from '../../types';
import { PortalRulesSettings } from './PortalRulesSettings';
import { PaidCancellationPolicy } from './PaidCancellationPolicy';
import { loadLauncherPreferences, saveLauncherPreferences, type LauncherPreferences } from '../../utils/launcherBranding';

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

export const SettingsView: React.FC = () => {
  const { company, currentProfile, updateCompany } = usePetGestor();
  const [form, setForm] = useState<Company>(company);
  const [launcher, setLauncher] = useState<LauncherPreferences>(() => loadLauncherPreferences());
  const canEdit = ['proprietario', 'administrador'].includes(currentProfile.role);

  useEffect(() => setForm(company), [company]);

  const change = (field: keyof Company, value: string | number) => {
    setForm(previous => ({ ...previous, [field]: value }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit) return;
    saveLauncherPreferences(launcher);
    updateCompany(form);
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <PortalRulesSettings />
      <PaidCancellationPolicy />
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações do PetShop</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Dados comerciais e regras usadas pela agenda.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3">
            <Palette className="h-5 w-5 text-teal-600" />
            <div><h3 className="font-bold text-slate-900 dark:text-white">Identidade do aplicativo e launcher</h3><p className="text-xs text-slate-500">Personalize a abertura e o login neste computador.</p></div>
          </div>
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium">Nome exibido no aplicativo<input className={`${fieldClass} mt-1`} value={launcher.app_title} onChange={event => setLauncher(previous => ({ ...previous, app_title: event.target.value }))} placeholder={form.trade_name || form.name} /></label>
              <label className="text-sm font-medium">Cor principal<input type="color" className="mt-1 h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900" value={launcher.primary_color} onChange={event => setLauncher(previous => ({ ...previous, primary_color: event.target.value }))} /></label>
              <label className="text-sm font-medium md:col-span-2">Frase do launcher<input className={`${fieldClass} mt-1`} value={launcher.tagline} onChange={event => setLauncher(previous => ({ ...previous, tagline: event.target.value }))} /></label>
              <label className="text-sm font-medium md:col-span-2">Mensagem da tela de login<input className={`${fieldClass} mt-1`} value={launcher.welcome_message} onChange={event => setLauncher(previous => ({ ...previous, welcome_message: event.target.value }))} /></label>
              <label className="text-sm font-medium md:col-span-2">URL do logotipo<input type="url" className={`${fieldClass} mt-1`} value={form.logo_url || ''} onChange={event => change('logo_url', event.target.value)} placeholder="https://seusite.com/logo.png" /></label>
            </div>
            <div className="overflow-hidden rounded-2xl text-white shadow-lg" style={{ backgroundColor: launcher.primary_color }}>
              <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
                {form.logo_url ? <img src={form.logo_url} alt="Prévia do logotipo" className="mb-4 h-20 w-20 rounded-2xl bg-white object-contain p-2" /> : <div className="mb-4 grid h-20 w-20 place-items-center rounded-2xl bg-white/20"><Image className="h-9 w-9" /></div>}
                <strong className="text-xl">{launcher.app_title || form.trade_name || form.name}</strong>
                <span className="mt-2 text-xs text-white/80">{launcher.tagline}</span>
              </div>
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 dark:text-white">Dados do estabelecimento</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium">Razão social<input className={`${fieldClass} mt-1`} value={form.name} onChange={event => change('name', event.target.value)} required /></label>
            <label className="text-sm font-medium">Nome fantasia<input className={`${fieldClass} mt-1`} value={form.trade_name || ''} onChange={event => change('trade_name', event.target.value)} /></label>
            <label className="text-sm font-medium">CNPJ<input className={`${fieldClass} mt-1`} value={form.cnpj || ''} onChange={event => change('cnpj', event.target.value)} /></label>
            <label className="text-sm font-medium">Telefone<input className={`${fieldClass} mt-1`} value={form.phone || ''} onChange={event => change('phone', event.target.value)} /></label>
            <label className="text-sm font-medium">WhatsApp<input className={`${fieldClass} mt-1`} value={form.whatsapp || ''} onChange={event => change('whatsapp', event.target.value)} /></label>
            <label className="text-sm font-medium">E-mail<input type="email" className={`${fieldClass} mt-1`} value={form.email || ''} onChange={event => change('email', event.target.value)} /></label>
            <label className="text-sm font-medium md:col-span-2">Endereço<input className={`${fieldClass} mt-1`} value={form.street || ''} onChange={event => change('street', event.target.value)} /></label>
            <label className="text-sm font-medium">Número<input className={`${fieldClass} mt-1`} value={form.number || ''} onChange={event => change('number', event.target.value)} /></label>
            <label className="text-sm font-medium">Bairro<input className={`${fieldClass} mt-1`} value={form.neighborhood || ''} onChange={event => change('neighborhood', event.target.value)} /></label>
            <label className="text-sm font-medium">Cidade<input className={`${fieldClass} mt-1`} value={form.city || ''} onChange={event => change('city', event.target.value)} /></label>
            <label className="text-sm font-medium">Estado<input maxLength={2} className={`${fieldClass} mt-1 uppercase`} value={form.state || ''} onChange={event => change('state', event.target.value.toUpperCase())} /></label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3">
            <Clock className="h-5 w-5 text-teal-600" />
            <div><h3 className="font-bold text-slate-900 dark:text-white">Funcionamento e agenda</h3><p className="text-xs text-slate-500">Agendamentos fora destes limites serão recusados.</p></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-medium">Abertura<input type="time" className={`${fieldClass} mt-1`} value={form.opening_time.slice(0, 5)} onChange={event => change('opening_time', event.target.value)} required /></label>
            <label className="text-sm font-medium">Fechamento<input type="time" className={`${fieldClass} mt-1`} value={form.closing_time.slice(0, 5)} onChange={event => change('closing_time', event.target.value)} required /></label>
            <label className="text-sm font-medium">Intervalo (minutos)<input type="number" min={5} step={5} className={`${fieldClass} mt-1`} value={form.slot_interval_minutes} onChange={event => change('slot_interval_minutes', Number(event.target.value))} required /></label>
            <label className="text-sm font-medium">Capacidade por horário<input type="number" min={1} className={`${fieldClass} mt-1`} value={form.capacity_per_slot} onChange={event => change('capacity_per_slot', Number(event.target.value))} required /></label>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={!canEdit} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" />Salvar configurações</button>
        </div>
      </form>
    </div>
  );
};