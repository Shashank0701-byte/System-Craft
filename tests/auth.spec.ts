import { test, expect } from '@playwright/test';

/**
 * SystemCraft — Auth Page Tests
 * Login page: AuthCard with email/password form + Google/GitHub buttons.
 * Inputs use label elements, not placeholders, for field identification.
 */
test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders login heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible({ timeout: 10_000 });
  });

  test('renders email and password inputs', async ({ page }) => {
    // Fields are identified by their labels, not placeholders
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('renders Google sign-in button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible({ timeout: 10_000 });
  });

  test('renders GitHub sign-in button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible({ timeout: 10_000 });
  });

  test('renders Sign In submit button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^Sign In$/i })).toBeVisible({ timeout: 10_000 });
  });

  test('has link to create account (signup)', async ({ page }) => {
    const signupLink = page.getByRole('link', { name: /create an account/i });
    await expect(signupLink).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Signup Page', () => {
  test('renders signup heading and name field', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /Create an Account/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel(/full name/i)).toBeVisible();
  });
});
