import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // O HMR pode ser desativado pela variável de ambiente DISABLE_HMR.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Desativa o monitoramento de arquivos quando DISABLE_HMR estiver habilitado.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
