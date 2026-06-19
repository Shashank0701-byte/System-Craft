import { test, expect } from '@playwright/test';

/**
 * SystemCraft — Landing Page Tests
 * The landing page is public with Navbar + GalaxyHero + BentoGrid + Footer.
 */
test.describe('Landing Page', () => {
  test('renders with correct title', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/SystemCraft/i);
  });

  test('navbar shows SystemCraft branding', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('SystemCraft').first()).toBeVisible();
  });

  test('navbar shows Get Started CTA', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const cta = page.getByRole('link', { name: /Get Started/i });
    await expect(cta).toBeVisible({ timeout: 15_000 });
  });

  test('Get Started navigates to signup page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const cta = page.getByRole('link', { name: /Get Started/i }).first();
    await expect(cta).toBeVisible({ timeout: 15_000 });
    await cta.click();

    await expect(page).toHaveURL(/\/signup\/?$/);
  });

  test('Sign In link navigates to login page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // "Sign In" link only appears after auth loading resolves (hidden sm:flex)
    const signIn = page.getByRole('link', { name: 'Sign In', exact: true }).first();
    await expect(signIn).toBeVisible({ timeout: 15_000 });
    await signIn.click();

    await expect(page).toHaveURL(/\/login\/?$/);
  });
});
