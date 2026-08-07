import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Eye, EyeOff, LockKeyhole, Mail, PawPrint, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { usePetGestor } from '../../context/AppContext';
import type { UserProfile } from '../../types';
import { loadLauncherPreferences, type LauncherPreferences } from '../../utils/launcherBranding';

type Mode = 'login' | 'signup' | 'reset' | 'update-password';

declare global {
  interface Window {
    petGestorDesktop?: {
      onAuthCallback: (callback: (url: string) => void) => () => void;
    };
  }
}

const authErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (normalized.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (normalized.includes('user already registered')) return 'Este e-mail já está cadastrado.';
  if (normalized.includes('password')) return 'A senha precisa ter pelo menos 8 caracteres.';
  return message;
};

export const AuthGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { company, setCurrentProfile } = usePetGestor();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLauncher, setShowLauncher] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [launcher, setLauncher] = useState<LauncherPreferences>(() => loadLauncherPreferences());

  const brandName = launcher.app_title.trim() || company.trade_name || company.name || 'PetGestor';

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLauncher(false), 1400);
    const refreshBranding = () => setLauncher(loadLauncherPreferences());
    window.addEventListener('petgestor-launcher-updated', refreshBranding);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('petgestor-launcher-updated', refreshBranding);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((authEvent, nextSession) => {
      setSession(nextSession);
      if (authEvent === 'PASSWORD_RECOVERY') {
        setMode('update-password');
        setShowLauncher(false);
        setLoading(false);
      }
      if (!nextSession) setProfile(null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleAuthCallback = async (callbackUrl: string) => {
      try {
        const url = new URL(callbackUrl);
        const query = url.searchParams;
        const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
        const code = query.get('code');
        const accessToken = hash.get('access_token') || query.get('access_token');
        const refreshToken = hash.get('refresh_token') || query.get('refresh_token');

        setLoading(true);
        setError(null);
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        }
        setMode('update-password');
      } catch (callbackError) {
        setError(authErrorMessage(callbackError instanceof Error ? callbackError.message : 'Link de recuperação inválido ou expirado.'));
        setMode('reset');
      } finally {
        setShowLauncher(false);
        setLoading(false);
      }
    };

    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.get('type') === 'recovery' || window.location.hash.includes('type=recovery')) {
      void handleAuthCallback(window.location.href);
    }

    return window.petGestorDesktop?.onAuthCallback(handleAuthCallback);
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

    if (mode === 'update-password') {
      if (password.length < 8) {
        setError('A nova senha precisa ter pelo menos 8 caracteres.');
      } else if (password !== passwordConfirmation) {
        setError('As senhas informadas não são iguais.');
      } else {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) setError(authErrorMessage(updateError.message));
        else {
          await supabase.auth.signOut();
          setPassword('');
          setPasswordConfirmation('');
          setMode('login');
          setMessage('Senha redefinida com sucesso. Entre com a nova senha.');
        }
      }
      setLoading(false);
      return;
    }

    if (mode === 'reset') {
      const redirectTo = window.petGestorDesktop
        ? 'petgestor://auth/reset'
        : `${window.location.origin}${window.location.pathname}?type=recovery`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
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

  if (loading || showLauncher) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-white" style={{ backgroundColor: launcher.primary_color }}>
        <div className="text-center">
          {company.logo_url ? <img src={company.logo_url} alt={brandName} className="mx-auto mb-5 h-28 w-28 rounded-3xl bg-white object-contain p-3 shadow-2xl" /> : <div className="mx-auto mb-5 grid h-28 w-28 place-items-center rounded-3xl bg-white/20 shadow-2xl"><PawPrint className="h-14 w-14" /></div>}
          <h1 className="text-3xl font-black">{brandName}</h1>
          <p className="mt-2 text-sm text-white/80">{launcher.tagline}</p>
          <RefreshCw className="mx-auto mt-7 h-6 w-6 animate-spin text-white/80" />
        </div>
      </div>
    );
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

  if (session && profile?.is_active && mode !== 'update-password') return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:grid-cols-[1.05fr_1fr]">
        <section className="hidden min-h-[620px] flex-col justify-between p-10 text-white lg:flex" style={{ backgroundColor: launcher.primary_color }}>
          <div>
            {company.logo_url ? <img src={company.logo_url} alt={brandName} className="h-20 w-20 rounded-2xl bg-white object-contain p-2" /> : <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white/20"><PawPrint size={40} /></div>}
            <h1 className="mt-6 text-4xl font-black">{brandName}</h1>
            <p className="mt-3 max-w-sm text-lg text-white/80">{launcher.tagline}</p>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/75">{launcher.welcome_message}</p>
        </section>
      <form onSubmit={submit} className="space-y-5 p-7 sm:p-10 lg:p-12">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl text-white lg:hidden" style={{ backgroundColor: launcher.primary_color }}>{company.logo_url ? <img src={company.logo_url} alt={brandName} className="h-full w-full bg-white object-contain p-2" /> : <PawPrint size={30} />}</div>
          <h1 className="text-2xl font-black text-slate-900">{mode === 'login' ? 'Bem-vindo' : mode === 'update-password' ? 'Crie uma nova senha' : brandName}</h1>
          <p className="text-sm text-slate-500">{mode === 'login' ? 'Entre para acessar o pet shop' : mode === 'signup' ? 'Crie o primeiro acesso' : mode === 'update-password' ? 'Informe e confirme sua nova senha' : 'Recupere sua senha'}</p>
        </div>

        {mode === 'signup' && <label className="block space-y-1"><span className="text-xs font-bold text-slate-600">Nome completo</span><input required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600" /></label>}
        {mode !== 'update-password' && <label className="block space-y-1"><span className="text-xs font-bold text-slate-600">E-mail</span><div className="relative"><Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 outline-none focus:border-teal-600" /></div></label>}
        {mode !== 'reset' && <label className="block space-y-1"><span className="text-xs font-bold text-slate-600">Senha</span><div className="relative"><LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-11 outline-none focus:border-teal-600" /><button type="button" onClick={() => setShowPassword(previous => !previous)} className="absolute right-3 top-3 text-slate-400" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></label>}
        {mode === 'update-password' && <label className="block space-y-1"><span className="text-xs font-bold text-slate-600">Confirmar nova senha</span><div className="relative"><LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input type={showPassword ? 'text' : 'password'} required minLength={8} value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-teal-600" /></div></label>}
        {error && <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm font-semibold text-rose-700">{error}</p>}
        {message && <p className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm font-semibold text-emerald-700">{message}</p>}
        <button disabled={loading} style={{ backgroundColor: launcher.primary_color }} className="w-full rounded-xl px-5 py-3.5 font-black text-white transition hover:brightness-90 disabled:opacity-60">{loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar acesso' : mode === 'update-password' ? 'Salvar nova senha' : 'Enviar recuperação'}</button>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-bold">
          {mode !== 'login' && mode !== 'update-password' && <button type="button" onClick={() => { setMode('login'); setError(null); setMessage(null); }} className="text-teal-700">Voltar ao login</button>}
          {mode === 'login' && <><button type="button" onClick={() => setMode('signup')} className="text-teal-700">Primeiro acesso</button><button type="button" onClick={() => setMode('reset')} className="text-slate-500">Esqueci a senha</button></>}
        </div>
      </form></div>
    </div>
  );
};
