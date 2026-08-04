export interface CapacitorConfig {
  appId?: string;
  appName?: string;
  webDir?: string;
  server?: {
    androidScheme?: string;
    url?: string;
    cleartext?: boolean;
  };
  plugins?: Record<string, any>;
}

const config: CapacitorConfig = {
  appId: 'com.petgestor.app',
  appName: 'PetGestor',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f8fafc',
      showSpinner: false
    }
  }
};

export default config;
