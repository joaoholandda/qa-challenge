// tests/api/reqres.spec.ts
import { test, expect, APIRequestContext } from '@playwright/test';

// O baseURL ('https://reqres.in') é idealmente configurado no playwright.config.ts para o projeto 'api_tests'.
// Se não estiver lá, descomente e use a linha abaixo:
// const baseURL = 'https://reqres.in'; 

let apiContext: APIRequestContext;

// Configuração executada uma vez antes de todos os testes neste arquivo.
test.beforeAll(async ({ playwright }) => {
  apiContext = await playwright.request.newContext({
    // A baseURL é herdada da configuração do projeto se definida lá.
    // baseURL: baseURL, // Use esta linha se não estiver no config do projeto.
    extraHTTPHeaders: {
      'x-api-key': 'reqres-free-v1', // Chave de API para autorizar requisições.
    },
  });
});

// Limpeza executada uma vez após todos os testes neste arquivo.
test.afterAll(async ({}) => {
  await apiContext.dispose(); // Libera os recursos do contexto da API.
});

// Suíte principal de testes para a API Reqres.
test.describe('Parte 2: Testes de API com Playwright - Reqres API', () => {
  
  // Testes para a funcionalidade de listar usuários.
  test.describe('1. Listar usuários e validar dados', () => {
    test('1.1 Deve listar usuários da página 2, validar status 200 e integridade dos dados', async () => {
      const response = await apiContext.get('/api/users?page=2'); // Requisição GET para listar usuários.

      expect(response.status()).toBe(200); // Valida o status code HTTP 200 (OK).
      const responseBody = await response.json(); // Converte a resposta para JSON.

      // Validações da estrutura da paginação e dos dados recebidos.
      expect(responseBody.page).toBe(2);
      expect(responseBody.per_page).toBeDefined();
      expect(responseBody.total).toBeDefined();
      expect(responseBody.total_pages).toBeDefined();
      expect(Array.isArray(responseBody.data)).toBe(true); // Verifica se 'data' é um array.
      expect(responseBody.data.length).toBeGreaterThan(0); // Verifica se o array de dados não está vazio.

      // Valida os campos obrigatórios e tipos para cada usuário na lista.
      for (const user of responseBody.data) {
        expect(user).toHaveProperty('id');
        expect(typeof user.id).toBe('number');
        expect(user).toHaveProperty('email');
        expect(typeof user.email).toBe('string');
        expect(user.email).toMatch(/.+@.+\..+/); // Valida o formato do email (simples).
        expect(user).toHaveProperty('first_name');
        expect(typeof user.first_name).toBe('string');
        expect(user).toHaveProperty('last_name');
        expect(typeof user.last_name).toBe('string');
        expect(user).toHaveProperty('avatar');
        expect(typeof user.avatar).toBe('string');
      }
    });
  });

  // Testes para as funcionalidades de criar e atualizar usuários.
  test.describe('2. Criar e atualizar um usuário', () => {
    let createdUserIdString: string; // Armazena o ID do usuário criado (Reqres retorna como string).

    test('2.1 Deve criar um novo usuário (POST), validar status 201 e dados retornados', async () => {
      const newUserPayload = {
        name: 'Maria Testadora',
        job: 'Engenheira de Testes Sênior',
      };
      const response = await apiContext.post('/api/users', { // Requisição POST para criar usuário.
        data: newUserPayload,
      });

      expect(response.status()).toBe(201); // Valida o status code HTTP 201 (Created).
      const responseBody = await response.json();

      // Valida se os dados do usuário criado correspondem ao payload enviado.
      expect(responseBody.name).toBe(newUserPayload.name);
      expect(responseBody.job).toBe(newUserPayload.job);
      expect(responseBody).toHaveProperty('id'); // Verifica a presença do ID.
      expect(typeof responseBody.id).toBe('string'); // Verifica o tipo do ID.
      createdUserIdString = responseBody.id; // Guarda o ID.
      expect(responseBody).toHaveProperty('createdAt'); // Verifica a presença da data de criação.
      expect(typeof responseBody.createdAt).toBe('string');
    });

    test('2.2 Deve atualizar um usuário existente (PUT), validar status 200 e dados atualizados', async () => {
      const userIdToUpdate = 2; // ID do usuário a ser atualizado, conforme desafio.
      const updatedUserPayload = {
        name: 'Carlos Atualizado',
        job: 'Líder de QA Estratégico',
      };

      const response = await apiContext.put(`/api/users/${userIdToUpdate}`, { // Requisição PUT para atualizar.
        data: updatedUserPayload,
      });

      expect(response.status()).toBe(200); // Valida o status code HTTP 200 (OK).
      const responseBody = await response.json();

      // Valida se os dados do usuário foram atualizados corretamente.
      expect(responseBody.name).toBe(updatedUserPayload.name);
      expect(responseBody.job).toBe(updatedUserPayload.job);
      expect(responseBody).toHaveProperty('updatedAt'); // Verifica a presença da data de atualização.
      expect(typeof responseBody.updatedAt).toBe('string');
    });
  });

  // Testes para verificar a manipulação de falhas e erros pela API.
  test.describe('3. Manipulação de falhas na API', () => {
    test('3.1 Deve retornar erro 404 ao tentar buscar um usuário que não existe (GET)', async () => {
      const nonExistentUserId = 999999; // ID com alta probabilidade de não existir.
      const response = await apiContext.get(`/api/users/${nonExistentUserId}`); // Requisição GET.

      expect(response.status()).toBe(404); // Valida o status code HTTP 404 (Not Found).
    });

    test('3.2 Deve lidar com erro de tempo limite (timeout) na API', async () => {
      try {
        // Requisição GET para um endpoint que simula delay, com timeout baixo.
        await apiContext.get('/api/users?delay=5', { // API Reqres aceita `delay` para simular lentidão.
          timeout: 2000, // Configura o timeout da requisição para 2 segundos.
        });
        // Se a linha acima não lançar erro, o timeout não ocorreu como esperado.
        throw new Error('A requisição não falhou com timeout como esperado.');
      } catch (error) {
        // Valida se a mensagem de erro capturada indica um timeout.
        expect(error.message).toContain('timed out'); 
      }
    });
  });
});