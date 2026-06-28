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
    await expect(page.getByRole('heading', { name: /Resume Session/i })).toBeVisible({ timeout: 5_000 });
  });

  test('renders email and password inputs', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('renders Google sign-in button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible({ timeout: 5_000 });
  });

  test('renders GitHub sign-in button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible({ timeout: 5_000 });
  });

  test('renders Sign In submit button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^Authenticate$/i })).toBeVisible({ timeout: 5_000 });
  });

  test('has link to create account (signup)', async ({ page }) => {
    const signupLink = page.getByRole('link', { name: /Create a workspace/i });
    await expect(signupLink).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Signup Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('renders signup heading and name field', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Initialize Sandbox/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByLabel(/full name/i)).toBeVisible();
  });

  test('renders email and password inputs', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('renders Create Account submit button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Initialize Sandbox/i })).toBeVisible({ timeout: 5_000 });
  });

  test('renders Google and GitHub sign-in buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
  });

  test('has link to sign in (login)', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Authenticate/i })).toBeVisible({ timeout: 5_000 });
  });
});
