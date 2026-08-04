import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LockKeyhole, Mail, PawPrint, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { usePetGestor } from '../../context/AppContext';
import type { UserProfile } from '../../types';

type Mode = 'login' | 'signup' | 'reset';

const authErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (normalized.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (normalized.includes('user already registered')) return 'Este e-mail já está cadastrado.';
  if (normalized.includes('password')) return 'A senha precisa ter pelo menos 8 caracteres.';
  return message;
};

export const AuthGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { setCurrentProfile } = usePetGestor();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setProfile(null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    let active = true;
    setLoading(true);

    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error: profileError }) => {
        if (!active) return;
        if (profileError) {
          setError('Não foi possível carregar o perfil deste usuário.');
        } else {
          const loadedProfile = data as UserProfile;
          setProfile(loadedProfile);
          setCurrentProfile(loadedProfile);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.user?.id, setCurrentProfile]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === 'reset') {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (resetError) setError(authErrorMessage(resetError.message));
      else setMessage('Enviamos as instruções de recuperação para o seu e-mail.');
      setLoading(false);
      return;
    }

    if (mode === 'signup') {
      if (password.length < 8) {
        setError('A senha precisa ter pelo menos 8 caracteres.');
        setLoading(false);
        return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (signUpError) setError(authErrorMessage(signUpError.message));
      else if (!data.session) setMessage('Cadastro realizado. Confirme o e-mail para entrar.');
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(authErrorMessage(signInError.message));
    setLoading(false);
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-lg rounded-3xl bg-white border border-amber-200 p-8 shadow-xl text-center space-y-3">
          <PawPrint className="mx-auto h-10 w-10 text-teal-600" />
          <h1 className="text-xl font-black text-slate-900">Supabase ainda não configurado</h1>
          <p className="text-sm text-slate-600">Crie o arquivo .env.local com a URL e a chave publicável indicadas no .env.example e reinicie o projeto.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-teal-600" /></div>;
  }

  if (session && profile && !profile.is_active) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md rounded-3xl bg-white border border-slate-200 p-8 shadow-xl text-center space-y-4">
          <LockKeyhole className="mx-auto h-10 w-10 text-amber-600" />
          <h1 className="text-xl font-black text-slate-900">Acesso aguardando liberação</h1>
          <p className="text-sm text-slate-600">Um proprietário ou administrador precisa vincular e ativar este usuário.</p>
          <button onClick={() => supabase.auth.signOut()} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">Sair</button>
        </div>
      </div>
    );
  }

  if (session && profile?.is_active) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-5">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-7 sm:p-9 shadow-2xl space-y-5">
        <div className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center"><PawPrint size={30} /></div>
          <h1 className="text-2xl font-black text-slate-900">PetGestor</h1>
          <p className="text-sm text-slate-500">{mode === 'login' ? 'Entre para acessar o pet shop' : mode === 'signup' ? 'Crie o primeiro acesso' : 'Recupere sua senha'}</p>
        </div>

        {mode === 'signup' && <label className="block space-y-1"><span className="text-xs font-bold text-slate-600">Nome completo</span><input required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600" /></label>}
        <label className="block space-y-1"><span className="text-xs font-bold text-slate-600">E-mail</span><div className="relative"><Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 outline-none focus:border-teal-600" /></div></label>
        {mode !== 'reset' && <label className="block space-y-1"><span className="text-xs font-bold text-slate-600">Senha</span><div className="relative"><LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 outline-none focus:border-teal-600" /></div></label>}
        {error && <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm font-semibold text-rose-700">{error}</p>}
        {message && <p className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm font-semibold text-emerald-700">{message}</p>}
        <button disabled={loading} className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 px-5 py-3.5 font-black text-white transition">{loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar acesso' : 'Enviar recuperação'}</button>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-bold">
          {mode !== 'login' && <button type="button" onClick={() => { setMode('login'); setError(null); setMessage(null); }} className="text-teal-700">Voltar ao login</button>}
          {mode === 'login' && <><button type="button" onClick={() => setMode('signup')} className="text-teal-700">Primeiro acesso</button><button type="button" onClick={() => setMode('reset')} className="text-slate-500">Esqueci a senha</button></>}
        </div>
      </form>
    </div>
  );
};
