import { test, expect } from '@playwright/test';

/**
 * SystemCraft — Navigation & Accessibility Tests
 * Tests public pages (landing, login, signup) since dashboard requires auth.
 */
test.describe('Navigation', () => {
  test('landing page navbar has Features, Pricing, Blog links', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: /Features/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /Pricing/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Blog/i })).toBeVisible();
  });

  test('login page has link back to signup', async ({ page }) => {
    await page.goto('/login');

    const createLink = page.getByRole('link', { name: /create an account/i });
    await expect(createLink).toBeVisible({ timeout: 10_000 });
    await createLink.click();

    await expect(page).toHaveURL(/signup/);
  });

  test('signup page has link back to login', async ({ page }) => {
    await page.goto('/signup');

    const signInLink = page.getByRole('link', { name: /sign in/i });
    await expect(signInLink).toBeVisible({ timeout: 10_000 });
    await signInLink.click();

    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Accessibility', () => {
  test('landing page has no broken images', async ({ page }) => {
    await page.goto('/');
    // Wait for page to settle (Spline 3D, lazy images, etc.)
    await page.waitForTimeout(3000);

    const images = page.locator('img[src]');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      // Skip non-standard sources (data URIs, blobs, inline SVGs, Next.js optimized)
      if (!src || src.startsWith('data:') || src.startsWith('blob:') || src.includes('_next/image')) continue;
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(naturalWidth, `Broken image: ${src}`).toBeGreaterThan(0);
    }
  });

  test('login page buttons all have accessible text', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(2000);

    const buttons = page.getByRole('button');
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
