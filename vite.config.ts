import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseadas no modo (development/production)
  // Fix: Cast process to any to avoid type error with cwd() in some environments
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Isso permite que o código use essas variáveis no navegador
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})