// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // testDir: './tests', // O Playwright usará os testDir definidos nos projetos abaixo.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },

  projects: [
    // Projeto para Testes de UI
    {
      name: 'ui_tests',
      testDir: './tests/ui', // Diretório para testes de UI (onde está seu swaglabs.spec.ts)
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.saucedemo.com',
        headless: true, // Mude para false para ver o navegador durante testes locais

        // --- CONFIGURAÇÃO DE SCREENSHOT E VÍDEO PARA TESTES DE UI ---
        screenshot: 'on', // <<<--- AQUI! Tira screenshot ao final de cada teste (sucesso ou falha) e na falha.
        video: 'retain-on-failure', // Opção recomendada: grava todos, mas mantém apenas vídeos de testes que falharam.
      },
    },

    // Projeto para Testes de API
    {
      name: 'api_tests',
      testDir: './tests/api', // Diretório para testes de API
      use: {
        baseURL: 'https://reqres.in',
        extraHTTPHeaders: {
          'x-api-key': 'reqres-free-v1',
        },
      },
    },
  ],
});