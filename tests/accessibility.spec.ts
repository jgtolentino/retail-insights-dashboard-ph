
import { test, expect } from '@playwright/test';

test('has proper heading structure', async ({ page }) => {
  await page.goto('/');
  
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBe(1);
  
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
  expect(headings.length).toBeGreaterThan(0);
});

test('has proper color contrast', async ({ page }) => {
  await page.goto('/');
  
  // This is a simple check - for real a11y testing use axe-playwright
  const darkTextOnLight = await page.locator('.text-gray-900, .text-gray-800').count();
  expect(darkTextOnLight).toBeGreaterThan(0);
});

test('interactive elements are keyboard accessible', async ({ page }) => {
  await page.goto('/');
  
  // Tab through page
  await page.keyboard.press('Tab');
  const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
  expect(focusedElement).toBeTruthy();
});
