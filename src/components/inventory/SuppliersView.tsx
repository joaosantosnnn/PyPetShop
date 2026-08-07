import React, { useState } from 'react';
import { Building2, Mail, MapPin, Phone, Plus, Truck, X } from 'lucide-react';
import { usePetGestor } from '../../context/AppContext';

const fieldClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800';

export const SuppliersView: React.FC = () => {
  const { suppliers, addSupplier } = usePetGestor();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredSuppliers = suppliers.filter(supplier => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return true;
    return [supplier.company_name, supplier.trade_name, supplier.cnpj, supplier.contact_person]
      .some(value => value?.toLocaleLowerCase('pt-BR').includes(term));
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    addSupplier({
      company_name: String(form.get('companyName')).trim(),
      trade_name: String(form.get('tradeName')).trim() || undefined,
      cnpj: String(form.get('cnpj')).trim() || undefined,
      contact_person: String(form.get('contactPerson')).trim() || undefined,
      phone: String(form.get('phone')).trim() || undefined,
      whatsapp: String(form.get('whatsapp')).trim() || undefined,
      email: String(form.get('email')).trim() || undefined,
      address: String(form.get('address')).trim() || undefined,
      notes: String(form.get('notes')).trim() || undefined,
      is_active: true,
    });
    setIsFormOpen(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold"><Truck className="h-6 w-6 text-teal-600" />Fornecedores</h2>
          <p className="text-xs text-slate-500">Cadastro e contatos dos fornecedores do PetShop</p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-700">
          <Plus className="h-4 w-4" /> Cadastrar fornecedor
        </button>
      </div>

      <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por empresa, nome fantasia, CNPJ ou contato..." className={fieldClass} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredSuppliers.map(supplier => (
          <section key={supplier.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><Building2 className="h-5 w-5" /></div>
              <div className="min-w-0"><h3 className="truncate font-bold">{supplier.trade_name || supplier.company_name}</h3><p className="truncate text-xs text-slate-500">{supplier.company_name}</p></div>
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              {supplier.cnpj && <p><b>CNPJ:</b> {supplier.cnpj}</p>}
              {supplier.contact_person && <p><b>Contato:</b> {supplier.contact_person}</p>}
              {supplier.phone && <p className="flex gap-2"><Phone className="h-4 w-4 text-teal-600" />{supplier.phone}</p>}
              {supplier.email && <p className="flex gap-2"><Mail className="h-4 w-4 text-teal-600" />{supplier.email}</p>}
              {supplier.address && <p className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-teal-600" />{supplier.address}</p>}
            </div>
          </section>
        ))}
        {!filteredSuppliers.length && <p className="col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">Nenhum fornecedor encontrado.</p>}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/60 p-4">
          <form onSubmit={submit} className="w-full max-w-2xl space-y-3 rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between"><h3 className="font-bold">Novo fornecedor</h3><button type="button" onClick={() => setIsFormOpen(false)}><X className="h-5 w-5" /></button></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="companyName" required placeholder="Razão social *" className={fieldClass} />
              <input name="tradeName" placeholder="Nome fantasia" className={fieldClass} />
              <input name="cnpj" placeholder="CNPJ" className={fieldClass} />
              <input name="contactPerson" placeholder="Pessoa de contato" className={fieldClass} />
              <input name="phone" placeholder="Telefone" className={fieldClass} />
              <input name="whatsapp" placeholder="WhatsApp" className={fieldClass} />
              <input name="email" type="email" placeholder="E-mail" className={fieldClass} />
              <input name="address" placeholder="Endereço" className={fieldClass} />
            </div>
            <textarea name="notes" rows={3} placeholder="Observações" className={fieldClass} />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border px-4 py-2 text-sm">Cancelar</button><button className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white">Salvar fornecedor</button></div>
          </form>
        </div>
      )}
    </div>
  );
};
