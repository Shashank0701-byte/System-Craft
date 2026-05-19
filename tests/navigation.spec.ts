import { test, expect } from '@playwright/test';

/**
 * SystemCraft — Navigation & Accessibility Tests
 * Tests public pages (landing, login, signup) since dashboard requires auth.
 */
test.describe('Navigation', () => {
  test('landing page navbar has Features, Pricing, Blog links', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('link', { name: /Features/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /Pricing/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Blog/i })).toBeVisible();
  });

  test('login page has link back to signup', async ({ page }) => {
    await page.goto('/login');

    const createLink = page.getByRole('link', { name: /create an account/i });
    await expect(createLink).toBeVisible({ timeout: 15_000 });
    await createLink.click();

    await expect(page).toHaveURL(/\/signup\/?$/);
  });

  test('signup page has link back to login', async ({ page }) => {
    await page.goto('/signup');

    const signInLink = page.getByRole('link', { name: /sign in/i });
    await expect(signInLink).toBeVisible({ timeout: 15_000 });
    await signInLink.click();

    await expect(page).toHaveURL(/\/login\/?$/);
  });
});

test.describe('Accessibility', () => {
  test('landing page has no broken static images', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000); // Wait for page to settle

    const brokenImages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img[src]')).filter(img => {
        const src = img.getAttribute('src');
        if (!src || src.startsWith('data:') || src.startsWith('blob:') || src.includes('_next/image') || src.endsWith('.svg')) return false;
        return (img as HTMLImageElement).naturalWidth === 0;
      }).length;
    });
    expect(brokenImages).toBe(0);
  });

  test('login page buttons all have accessible text', async ({ page }) => {
    await page.goto('/login');

    const buttons = page.getByRole('button');
    await expect(buttons.first()).toBeVisible({ timeout: 15_000 });
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const ariaLabel = await btn.getAttribute('aria-label');
      const text = await btn.innerText().catch(() => '');
      const hasName = (ariaLabel && ariaLabel.trim().length > 0) || (text && text.trim().length > 0);
      expect(hasName, `Button ${i} missing accessible name`).toBeTruthy();
    }
  });
});
