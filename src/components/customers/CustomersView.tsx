import React, { useState } from 'react';
import { usePetGestor } from '../../context/AppContext';
import { Customer } from '../../types';
import { formatBRL, formatDate, exportToExcel } from '../../utils/formatters';
import { CustomerFormModal } from './CustomerFormModal';
import { 
  Users, Search, Plus, FileSpreadsheet, Edit3, 
  Phone, Mail, MapPin, Dog, ShoppingBag, Calendar, 
  ChevronRight, X, PhoneCall
} from 'lucide-react';
import { generateWhatsAppLink } from '../../utils/whatsapp';

export const CustomersView: React.FC = () => {
  const { 
    customers, pets, sales, appointments, 
    addCustomer, updateCustomer, toggleCustomerActive 
  } = usePetGestor();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Filtered customers
  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term)) ||
      (c.cpf && c.cpf.includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  });

  // Handle Export to Excel
  const handleExportExcel = () => {
    const dataToExport = customers.map(c => ({
      Nome: c.name,
      CPF: c.cpf || '-',
      Telefone: c.phone || '-',
      WhatsApp: c.whatsapp || '-',
      Email: c.email || '-',
      'Data de Nascimento': c.birth_date ? formatDate(c.birth_date) : '-',
      Endereço: `${c.address || ''}, ${c.number || ''} ${c.neighborhood || ''} - ${c.city || ''}/${c.state || ''}`,
      'Total Gasto': c.total_spent,
      'Saldo devedor': c.outstanding_balance,
      Status: c.is_active ? 'Ativo' : 'Inativo',
    }));
    exportToExcel(dataToExport, 'Clientes_PetGestor');
  };

  const handleSaveCustomer = (data: any) => {
    if (editingCustomer) {
      updateCustomer(data);
    } else {
      addCustomer(data);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600" />
            Gestão de Tutores & Clientes
          </h2>
          <p className="text-xs text-slate-500">
            Total de {customers.length} tutores cadastrados com histórico completo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
          </button>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Cadastrar Tutor
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por nome, telefone, CPF ou e-mail..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Customer Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase font-bold text-slate-400">
                <th className="py-3 px-4">Tutor / Contato</th>
                <th className="py-3 px-4">Cidade / Endereço</th>
                <th className="py-3 px-4">Pets Vinculados</th>
                <th className="py-3 px-4">Total Gasto</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Nenhum cliente encontrado com estes critérios.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => {
                  const customerPets = pets.filter(p => p.customer_id === customer.id);
                  const waLink = generateWhatsAppLink(customer.whatsapp || customer.phone || '', `Olá ${customer.name}!`);

                  return (
                    <tr 
                      key={customer.id} 
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${!customer.is_active ? 'opacity-60' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {customer.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-slate-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-teal-600" /> {customer.phone || '-'}
                          </span>
                          {customer.whatsapp && (
                            <a 
                              href={waLink} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-emerald-600 font-bold hover:underline"
                            >
                              [WhatsApp]
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div>{customer.neighborhood ? `${customer.neighborhood}, ` : ''}{customer.city} - {customer.state}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{customer.address ? `${customer.address}, ${customer.number || ''}` : 'Endereço não informado'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {customerPets.length === 0 ? (
                            <span className="text-slate-400 italic">Sem pets</span>
                          ) : (
                            customerPets.map(p => (
                              <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-semibold text-[11px]">
                                <Dog className="w-3 h-3" /> {p.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatBRL(customer.total_spent)}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleCustomerActive(customer.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            customer.is_active 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {customer.is_active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                            title="Ver Detalhes do Cliente"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingCustomer(customer);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                            title="Editar Cliente"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-black text-xl">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-500">CPF: {selectedCustomer.cpf || 'Não informado'} | Cadastro em {formatDate(selectedCustomer.created_at)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 text-xs">
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="font-bold text-slate-700 dark:text-slate-300 uppercase">Contatos & Localização</p>
                <p className="text-slate-600 dark:text-slate-300"><span className="font-semibold">Telefone:</span> {selectedCustomer.phone || '-'}</p>
                <p className="text-slate-600 dark:text-slate-300"><span className="font-semibold">WhatsApp:</span> {selectedCustomer.whatsapp || '-'}</p>
                <p className="text-slate-600 dark:text-slate-300"><span className="font-semibold">E-mail:</span> {selectedCustomer.email || '-'}</p>
                <p className="text-slate-600 dark:text-slate-300"><span className="font-semibold">Endereço:</span> {selectedCustomer.address ? `${selectedCustomer.address}, ${selectedCustomer.number || ''} - ${selectedCustomer.neighborhood || ''}, ${selectedCustomer.city}/${selectedCustomer.state}` : '-'}</p>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="font-bold text-slate-700 dark:text-slate-300 uppercase">Resumo Financeiro</p>
                <p className="text-slate-600 dark:text-slate-300"><span className="font-semibold">Total Histórico Gasto:</span> <span className="font-bold text-emerald-600">{formatBRL(selectedCustomer.total_spent)}</span></p>
                <p className="text-slate-600 dark:text-slate-300"><span className="font-semibold">Saldo em Aberto (Fiado):</span> <span className="font-bold text-rose-600">{formatBRL(selectedCustomer.outstanding_balance)}</span></p>
                <p className="text-slate-600 dark:text-slate-300"><span className="font-semibold">Preferência de Contato:</span> <span className="uppercase font-bold">{selectedCustomer.contact_preference}</span></p>
              </div>
            </div>

            {/* Pets Linked Section */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Dog className="w-4 h-4 text-teal-600" /> Animais Vinculados
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pets.filter(p => p.customer_id === selectedCustomer.id).map(p => (
                  <div key={p.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center">
                        {p.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">{p.name}</p>
                      <p className="text-[11px] text-slate-500">{p.breed || p.species} | {p.weight} kg</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <CustomerFormModal
        key={`${isModalOpen}-${editingCustomer?.id || 'novo'}`}
        isOpen={isModalOpen}
        customer={editingCustomer}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
      />
    </div>
  );
};
