import React, { useEffect, useState } from 'react';
import { Customer } from '../../types';
import { maskCPF, maskPhone, maskCEP } from '../../utils/formatters';
import { X, User, Phone, Mail, MapPin, FileText, CheckCircle2 } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  customer,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(customer?.name || '');
  const [cpf, setCpf] = useState(customer?.cpf || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [whatsapp, setWhatsapp] = useState(customer?.whatsapp || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [birthDate, setBirthDate] = useState(customer?.birth_date || '');
  const [postalCode, setPostalCode] = useState(customer?.postal_code || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [number, setNumber] = useState(customer?.number || '');
  const [complement, setComplement] = useState(customer?.complement || '');
  const [neighborhood, setNeighborhood] = useState(customer?.neighborhood || '');
  const [city, setCity] = useState(customer?.city || 'São Paulo');
  const [state, setState] = useState(customer?.state || 'SP');
  const [notes, setNotes] = useState(customer?.notes || '');
  const [contactPreference, setContactPreference] = useState<'whatsapp' | 'telefone' | 'email'>(customer?.contact_preference || 'whatsapp');
  const [communicationConsent, setCommunicationConsent] = useState(customer?.communication_consent ?? true);
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'success' | 'not_found' | 'error'>('idle');

  useEffect(() => {
    const cep = postalCode.replace(/\D/g, '');
    if (cep.length !== 8) {
      setCepStatus('idle');
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setCepStatus('loading');
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controller.signal });
        if (!response.ok) throw new Error('Falha ao consultar o CEP.');

        const data = await response.json() as {
          erro?: boolean;
          cep?: string;
          logradouro?: string;
          complemento?: string;
          bairro?: string;
          localidade?: string;
          uf?: string;
        };

        if (data.erro) {
          setCepStatus('not_found');
          return;
        }

        setPostalCode(maskCEP(data.cep || cep));
        setAddress(current => data.logradouro || current);
        setComplement(current => current || data.complemento || '');
        setNeighborhood(current => data.bairro || current);
        setCity(current => data.localidade || current);
        setState(current => data.uf || current);
        setCepStatus('success');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setCepStatus('error');
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [postalCode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...(customer || {}),
      name,
      cpf,
      phone,
      whatsapp: whatsapp || phone,
      email,
      birth_date: birthDate,
      postal_code: postalCode,
      address,
      number,
      complement,
      neighborhood,
      city,
      state,
      notes,
      contact_preference: contactPreference,
      communication_consent: communicationConsent,
      is_active: customer?.is_active ?? true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {customer ? 'Editar Tutor / Cliente' : 'Novo Tutor / Cliente'}
              </h3>
              <p className="text-xs text-slate-500">Cadastro de informações do tutor para contato e faturamento</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Section 1: Basic Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4" /> Dados Pessoais
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Fernanda Oliveira"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  CPF (Opcional)
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={e => setCpf(maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

            </div>
          </div>

          {/* Section 2: Contact Info */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-3 flex items-center gap-1.5">
              <Phone className="w-4 h-4" /> Contatos & Preferências
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone Principal
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(maskPhone(e.target.value))}
                  placeholder="(11) 98888-8888"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={e => setWhatsapp(maskPhone(e.target.value))}
                  placeholder="(11) 98888-8888"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Canal de Preferência
                </label>
                <select
                  value={contactPreference}
                  onChange={e => setContactPreference(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telefone">Telefone</option>
                  <option value="email">E-mail</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="consent"
                  checked={communicationConsent}
                  onChange={e => setCommunicationConsent(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="consent" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Aceita avisos e lembretes operacionais
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Address Info */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Endereço para Busca e Entrega (Táxi Dog)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={e => setPostalCode(maskCEP(e.target.value))}
                  placeholder="00000-000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                {cepStatus === 'loading' && <p className="mt-1 text-[10px] font-medium text-teal-600">Consultando CEP...</p>}
                {cepStatus === 'success' && <p className="mt-1 text-[10px] font-medium text-emerald-600">Endereço localizado.</p>}
                {cepStatus === 'not_found' && <p className="mt-1 text-[10px] font-medium text-amber-600">CEP não encontrado. Preencha o endereço manualmente.</p>}
                {cepStatus === 'error' && <p className="mt-1 text-[10px] font-medium text-rose-600">Não foi possível consultar o CEP. Tente novamente.</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Logradouro / Rua
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Rua Oscar Freire"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={number}
                  onChange={e => setNumber(e.target.value)}
                  placeholder="500"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  value={complement}
                  onChange={e => setComplement(e.target.value)}
                  placeholder="Apto 42"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={e => setNeighborhood(e.target.value)}
                  placeholder="Jardins"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Rio de Janeiro"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={state}
                  onChange={e => setState(e.target.value.toUpperCase())}
                  placeholder="RJ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações do Tutor
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Preferências específicas do cliente, avisos de horários, etc."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Modal Actions */}
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
              disabled={cepStatus === 'loading'}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition disabled:cursor-wait disabled:opacity-60"
            >
              {cepStatus === 'loading' ? 'Consultando CEP...' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
