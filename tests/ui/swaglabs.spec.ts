// tests/ui/swaglabs.spec.ts

import { test, expect, Page } from '@playwright/test';

// const baseURL = `https://www.saucedemo.com`; // Já está no playwright.config.ts
const standardUser = `standard_user`;
const lockedOutUser = `locked_out_user`;
const incorrectUser = `incorrect_user`;
const password = `secret_sauce`;
const incorrectPassword = `wrong_password`;

/**
 * Função auxiliar para realizar o login na aplicação.
 * @param page - A instância da página do Playwright.
 * @param username - O nome de usuário para login.
 * @param pwd - A senha para login (padrão é a senha correta).
 */
async function login(page: Page, username: string, pwd = password) {
    // A baseURL é pega da configuração do projeto no playwright.config.ts
    await page.goto('/'); 
    await page.locator(`[data-test="username"]`).fill(username);
    await page.locator(`[data-test="password"]`).fill(pwd);
    await page.locator(`[data-test="login-button"]`).click();
}

/**
 * Função auxiliar para adicionar um item ao carrinho pelo seu data-test ID.
 * @param page - A instância da página do Playwright.
 * @param itemNameId - O ID do item como aparece no data-test (ex: 'sauce-labs-backpack').
 */
async function addItemToCartById(page: Page, itemNameId: string) {
    await page.locator(`[data-test="add-to-cart-${itemNameId}"]`).click();
}

/**
 * Função auxiliar para remover um item do carrinho pelo seu data-test ID.
 * @param page - A instância da página do Playwright.
 * @param itemNameId - O ID do item como aparece no data-test (ex: 'sauce-labs-backpack').
 */
async function removeItemFromCartById(page: Page, itemNameId: string) {
  await page.locator(`[data-test="remove-${itemNameId}"]`).click();
}

// --- Início da Suíte de Testes de UI ---
test.describe('Parte 1: Automação de UI com Playwright - Swag Labs Demo', () => {
  // --- Testes de Login ---
  test.describe('1. Fluxos de Login', () => {
    test('1.1 Deve fazer login com credenciais corretas e redirecionar para a página principal', async ({ page }) => {
      await login(page, standardUser);

      // Valida se o usuário foi autenticado e redirecionado para a página de inventário
      // A baseURL é considerada na URL final por causa da configuração no playwright.config.ts
      await expect(page).toHaveURL(`/inventory.html`);
      await expect(page.locator('.title').getByText('Products')).toBeVisible();
      await expect(page.locator('.shopping_cart_link')).toBeVisible();
    });

    test('1.2 Deve mostrar mensagem de erro para usuário bloqueado', async ({ page }) => {
      await login(page, lockedOutUser);

      const errorMessage = page.locator('[data-test="error"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Epic sadface: Sorry, this user has been locked out.');
      await expect(page).not.toHaveURL(`/inventory.html`);
    });

    test('1.3 Deve mostrar mensagem de erro para senha incorreta', async ({ page }) => {
      await login(page, standardUser, incorrectPassword);

      const errorMessage = page.locator('[data-test="error"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Epic sadface: Username and password do not match any user in this service');
      await expect(page).not.toHaveURL(`/inventory.html`);
    });

    test('1.4 Deve mostrar mensagem de erro para usuário incorreto', async ({ page }) => {
      await login(page, incorrectUser, password);

      const errorMessage = page.locator('[data-test="error"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Epic sadface: Username and password do not match any user in this service');
      await expect(page).not.toHaveURL(`/inventory.html`);
    });
  });

  // --- Testes de Carrinho de Compras ---
  test.describe('2. Fluxos de Adicionar e Remover Produtos ao Carrinho', () => {
    test.beforeEach(async ({ page }) => { // Executa antes de CADA teste neste describe
      await login(page, standardUser);
      await expect(page.locator('.title').getByText('Products')).toBeVisible(); // Confirma que o login foi feito
    });

    test('2.1 Deve adicionar três produtos, validar todos no carrinho, remover dois e validar o restante', async ({ page }) => {
      const product1Id = 'sauce-labs-backpack';
      const product1Name = 'Sauce Labs Backpack';
      const product2Id = 'sauce-labs-bike-light';
      const product2Name = 'Sauce Labs Bike Light';
      const product3Id = 'sauce-labs-bolt-t-shirt';
      const product3Name = 'Sauce Labs Bolt T-Shirt';

      // Adiciona os produtos
      await addItemToCartById(page, product1Id);
      await addItemToCartById(page, product2Id);
      await addItemToCartById(page, product3Id);

      const cartBadge = page.locator('.shopping_cart_badge');
      await expect(cartBadge).toHaveText('3'); // Verifica o contador

      // Vai para o carrinho
      await page.locator('.shopping_cart_link').click();
      await expect(page).toHaveURL(`/cart.html`);

      // Verifica se os 3 itens estão no carrinho
      const itemsInCart = page.locator('.cart_item');
      await expect(itemsInCart).toHaveCount(3);
      await expect(itemsInCart.filter({ hasText: product1Name })).toBeVisible();
      await expect(itemsInCart.filter({ hasText: product2Name })).toBeVisible();
      await expect(itemsInCart.filter({ hasText: product3Name })).toBeVisible();

      // Remove dois produtos (da página do carrinho)
      await removeItemFromCartById(page, product1Id);
      await removeItemFromCartById(page, product3Id);

      await expect(cartBadge).toHaveText('1'); // Verifica o contador novamente
      await expect(itemsInCart).toHaveCount(1); // Verifica a quantidade de itens

      // Verifica o item restante e a ausência dos removidos
      await expect(itemsInCart.filter({ hasText: product2Name })).toBeVisible();
      await expect(itemsInCart.filter({ hasText: product1Name })).not.toBeVisible();
      await expect(itemsInCart.filter({ hasText: product3Name })).not.toBeVisible();
    });

    test('2.2 Deve validar se o contador do carrinho é atualizado corretamente (teste focado no contador)', async ({ page }) => {
      const cartBadge = page.locator('.shopping_cart_badge');
      await expect(cartBadge).not.toBeVisible(); // Carrinho deve estar vazio inicialmente

      await addItemToCartById(page, 'sauce-labs-onesie');
      await expect(cartBadge).toBeVisible();
      await expect(cartBadge).toHaveText('1');

      await addItemToCartById(page, 'sauce-labs-fleece-jacket');
      await expect(cartBadge).toHaveText('2');

      await removeItemFromCartById(page, 'sauce-labs-onesie');
      await expect(cartBadge).toHaveText('1');

      await removeItemFromCartById(page, 'sauce-labs-fleece-jacket');
      await expect(cartBadge).not.toBeVisible(); // Carrinho vazio novamente
    });
  });

  // --- Testes de Checkout ---
  test.describe('3. Fluxo de Simulação de Erro na Finalização da Compra', () => {
    test.beforeEach(async ({ page }) => { // Prepara o cenário antes de cada teste de checkout
      await login(page, standardUser);
      await addItemToCartById(page, 'sauce-labs-backpack'); // Adiciona um item para poder ir ao checkout
      await page.locator('.shopping_cart_link').click(); // Vai para o carrinho
      await expect(page).toHaveURL(`/cart.html`);
      await page.locator('[data-test="checkout"]').click(); // Clica em checkout
      await expect(page).toHaveURL(`/checkout-step-one.html`); // Confirma que está na página de informações
    });

    test('3.1 Deve exibir mensagens de erro ao tentar finalizar a compra sem preencher dados obrigatórios e depois prosseguir', async ({ page }) => {
      const continueButton = page.locator('[data-test="continue"]');
      const errorMessageContainer = page.locator('[data-test="error"]');

      // Tenta continuar sem preencher nada
      await continueButton.click();
      await expect(errorMessageContainer).toBeVisible();
      await expect(errorMessageContainer).toContainText('Error: First Name is required');
      await expect(page).toHaveURL(`/checkout-step-one.html`); // Permanece na mesma página

      // Preenche o primeiro nome e tenta novamente
      await page.locator('[data-test="firstName"]').fill('Teste');
      await continueButton.click();
      await expect(errorMessageContainer).toBeVisible();
      await expect(errorMessageContainer).toContainText('Error: Last Name is required');
      await expect(page).toHaveURL(`/checkout-step-one.html`);

      // Preenche o sobrenome e tenta novamente
      await page.locator('[data-test="lastName"]').fill('User');
      await continueButton.click();
      await expect(errorMessageContainer).toBeVisible();
      await expect(errorMessageContainer).toContainText('Error: Postal Code is required');
      await expect(page).toHaveURL(`/checkout-step-one.html`);

      // Preenche o CEP e finaliza com sucesso
      await page.locator('[data-test="postalCode"]').fill('12345');
      await continueButton.click();
      await expect(page).toHaveURL(`/checkout-step-two.html`); // Deve ir para a próxima página
      await expect(page.locator('.title').getByText('Checkout: Overview')).toBeVisible();
      // Valida se o item está na página de overview
      await expect(page.locator('.inventory_item_name').filter({hasText: 'Sauce Labs Backpack'})).toBeVisible();
    });
  });
});