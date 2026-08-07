export interface LauncherPreferences {
  app_title: string;
  tagline: string;
  welcome_message: string;
  primary_color: string;
}

const STORAGE_KEY = 'petgestor_launcher_preferences';

export const defaultLauncherPreferences: LauncherPreferences = {
  app_title: '',
  tagline: 'Gestão inteligente para o seu pet shop',
  welcome_message: 'Organize atendimentos, vendas e finanças em um só lugar.',
  primary_color: '#0f766e',
};

export const loadLauncherPreferences = (): LauncherPreferences => {
  try {
    return { ...defaultLauncherPreferences, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return defaultLauncherPreferences;
  }
};

export const saveLauncherPreferences = (preferences: LauncherPreferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent('petgestor-launcher-updated', { detail: preferences }));
};