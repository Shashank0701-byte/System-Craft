import { test, expect } from '@playwright/test';

/**
 * SystemCraft — Reference Architectures Tests
 * These pages live under /dashboard/ which requires auth.
 * Without auth, the page still renders (Next.js client-side routing)
 * but the sidebar/auth context may redirect.
 *
 * We test the gallery and detail pages at the URL level,
 * accepting that unauthenticated users may see a loading state or redirect.
 */
test.describe('Reference Architectures', () => {
  test('gallery page loads without crashing', async ({ page }) => {
    const response = await page.goto('/dashboard/reference-architectures');
    // Should get a 200 (page exists, even if auth redirects client-side)
    expect(response?.status()).toBeLessThan(500);
  });

  test('detail page for netflix-streaming loads without crashing', async ({ page }) => {
    const response = await page.goto('/dashboard/reference-architectures/netflix-streaming');
    expect(response?.status()).toBeLessThan(500);
  });

  test('detail page renders architecture title in top bar', async ({ page }) => {
    await page.goto('/dashboard/reference-architectures/netflix-streaming');

    // The top bar should contain the architecture name or "Gallery" back link
    const galleryLink = page.getByText(/Gallery/i);
    await expect(galleryLink.first()).toBeVisible({ timeout: 15_000 });
  });

  test('detail page shows Read-Only badge', async ({ page }) => {
    await page.goto('/dashboard/reference-architectures/netflix-streaming');
    await expect(page.getByText(/Read-Only Reference/i)).toBeVisible({ timeout: 15_000 });
  });

  test('detail page has Annotations and AI Analysis tabs', async ({ page }) => {
    await page.goto('/dashboard/reference-architectures/netflix-streaming');

    await expect(page.getByRole('button', { name: /Annotations/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /AI Analysis/i })).toBeVisible({ timeout: 15_000 });
  });

  test('detail page has Deep Analysis button', async ({ page }) => {
    await page.goto('/dashboard/reference-architectures/netflix-streaming');

    await expect(page.getByRole('button', { name: /Deep Analysis/i })).toBeVisible({ timeout: 15_000 });
  });

  test('invalid architecture ID shows Not Found', async ({ page }) => {
    await page.goto('/dashboard/reference-architectures/nonexistent-arch-xyz');

    await expect(page.getByText(/Not Found/i)).toBeVisible({ timeout: 15_000 });
  });
});
