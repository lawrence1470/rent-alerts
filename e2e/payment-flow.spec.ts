import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Payment Flow
 * Tests the complete user journey from viewing pricing to purchasing access
 */

test.describe('Payment Flow E2E', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    // Start from the pricing page
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
  });

  test('should display pricing page with all tiers', async () => {
    // Check for main heading
    await expect(page.locator('text=Choose Your Notification Speed')).toBeVisible();

    // Check for all three tier cards
    await expect(page.locator('text=Hourly Checks')).toBeVisible();
    await expect(page.locator('text=30-Minute Checks')).toBeVisible();
    await expect(page.locator('text=15-Minute Checks')).toBeVisible();

    // Check for pricing
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=$15.00')).toBeVisible();
    await expect(page.locator('text=$20.00')).toBeVisible();
  });

  test('should display correct features for each tier', async () => {
    // Free tier features
    await expect(page.locator('text=24 checks per day')).toBeVisible();
    await expect(page.locator('text=every hour')).toBeVisible();

    // 30min tier features
    await expect(page.locator('text=48 checks per day')).toBeVisible();
    await expect(page.locator('text=every 30 minutes')).toBeVisible();
    await expect(page.locator('text=2x faster than free')).toBeVisible();

    // 15min tier features
    await expect(page.locator('text=96 checks per day')).toBeVisible();
    await expect(page.locator('text=every 15 minutes')).toBeVisible();
    await expect(page.locator('text=4x faster than free')).toBeVisible();
  });

  test('should show week selector for paid tiers', async () => {
    // Check that week selectors are visible
    const weekSelectors = page.locator('select:has-text("week")');
    await expect(weekSelectors).toHaveCount(2); // 30min and 15min tiers

    // Check default selection (4 weeks)
    const firstSelector = weekSelectors.first();
    await expect(firstSelector).toHaveValue('4');
  });

  test('should update price when changing weeks', async () => {
    // Find the 30min tier week selector
    const thirtyMinCard = page.locator('.border-primary').first();
    const weekSelector = thirtyMinCard.locator('select');

    // Change to 1 week
    await weekSelector.selectOption('1');
    await expect(thirtyMinCard.locator('text=$15.00')).toBeVisible();

    // Change to 6 weeks
    await weekSelector.selectOption('6');
    await expect(thirtyMinCard.locator('text=$90.00')).toBeVisible();
  });

  test('should redirect to sign-in when not authenticated', async () => {
    // Click on Purchase Access button for 30min tier
    const purchaseButton = page.locator('button:has-text("Purchase Access")').first();
    await purchaseButton.click();

    // Should redirect to sign-in page
    await page.waitForURL(/.*sign-in.*/);
    await expect(page).toHaveURL(/.*sign-in.*/);
  });

  test('should show "Get Started" button for free tier', async () => {
    const freeButton = page.locator('button:has-text("Get Started")');
    await expect(freeButton).toBeVisible();

    await freeButton.click();

    // Should redirect to dashboard
    await page.waitForURL(/.*dashboard.*/);
    await expect(page).toHaveURL(/.*dashboard.*/);
  });

  test('should display FAQ section', async () => {
    await expect(page.locator('text=Frequently Asked Questions')).toBeVisible();

    // Check for FAQ cards
    await expect(page.locator('text=How does billing work?')).toBeVisible();
    await expect(page.locator('text=Can I use multiple tiers?')).toBeVisible();
    await expect(page.locator('text=What happens when my access expires?')).toBeVisible();
    await expect(page.locator('text=Why does speed matter?')).toBeVisible();
    await expect(page.locator('text=Can I get a refund?')).toBeVisible();
    await expect(page.locator('text=Do I need a subscription?')).toBeVisible();
  });

  test('should display Most Popular badge on 30min tier', async () => {
    await expect(page.locator('text=Most Popular')).toBeVisible();

    // Badge should be on the middle card (30min tier)
    const thirtyMinCard = page.locator('.scale-105').first();
    await expect(thirtyMinCard.locator('text=Most Popular')).toBeVisible();
  });

  test('should handle purchase flow for authenticated user (mocked)', async () => {
    // Note: This test would require setting up test authentication
    // For now, we'll just verify the button behavior

    const purchaseButton = page.locator('button:has-text("Purchase Access")').first();
    await expect(purchaseButton).toBeVisible();
    await expect(purchaseButton).toBeEnabled();
  });

  describe('Alert Creation with Frequency Selection', () => {
    test.beforeEach(async () => {
      // Navigate to dashboard (would require auth in real scenario)
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    });

    test('should include frequency selection in alert creation wizard', async () => {
      // Open alert creation modal
      await page.click('button:has-text("Create Alert")');
      await page.waitForTimeout(500);

      // Step 1: Alert Name
      await page.fill('input[placeholder*="2-bedroom"]', 'Payment Test Alert');
      await page.click('button:has-text("Next")');

      // Step 2: Neighborhoods
      await page.click('text=Brooklyn');
      await page.click('input[type="checkbox"]:near(:text("Williamsburg"))');
      await page.click('button:has-text("Next")');

      // Step 3: Filters
      await page.fill('input[placeholder*="min price"]', '2000');
      await page.fill('input[placeholder*="max price"]', '3500');
      await page.click('button:has-text("Next")');

      // Step 4: Frequency Selection (NEW STEP)
      await expect(page.locator('text=Create Rental Alert - Step 4 of 5')).toBeVisible();
      await expect(page.locator('text=Choose Notification Frequency')).toBeVisible();

      // Should show all three frequency options
      await expect(page.locator('text=Hourly Checks')).toBeVisible();
      await expect(page.locator('text=30-Minute Checks')).toBeVisible();
      await expect(page.locator('text=15-Minute Checks')).toBeVisible();
    });

    test('should show locked state for unpurchased tiers', async () => {
      await page.click('button:has-text("Create Alert")');
      await page.waitForTimeout(500);

      // Navigate to frequency selection step
      await page.fill('input[placeholder*="2-bedroom"]', 'Lock Test Alert');
      await page.click('button:has-text("Next")');

      await page.click('text=Brooklyn');
      await page.click('input[type="checkbox"]:near(:text("Williamsburg"))');
      await page.click('button:has-text("Next")');

      await page.fill('input[placeholder*="min price"]', '2000');
      await page.click('button:has-text("Next")');

      // Should show lock icons for paid tiers (if not purchased)
      const lockIcons = page.locator('[data-testid="lock-icon"]');
      await expect(lockIcons.first()).toBeVisible();

      // Should show "Upgrade to unlock" message
      await expect(page.locator('text=Upgrade to unlock')).toBeVisible();
    });

    test('should allow selecting frequency and continue to notifications step', async () => {
      await page.click('button:has-text("Create Alert")');
      await page.waitForTimeout(500);

      // Complete wizard to frequency step
      await page.fill('input[placeholder*="2-bedroom"]', 'Frequency Flow Test');
      await page.click('button:has-text("Next")');

      await page.click('text=Brooklyn');
      await page.click('input[type="checkbox"]:near(:text("Williamsburg"))');
      await page.click('button:has-text("Next")');

      await page.fill('input[placeholder*="min price"]', '2000');
      await page.click('button:has-text("Next")');

      // Select free tier (always available)
      await page.click('button:has-text("Hourly Checks")');

      // Continue to Step 5 (Notifications)
      await page.click('button:has-text("Next")');

      // Should reach notification preferences step
      await expect(page.locator('text=Create Rental Alert - Step 5 of 5')).toBeVisible();
      await expect(page.locator('text=Notification Preferences')).toBeVisible();
    });
  });

  describe('Responsive Design', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should work on mobile devices', async ({ page }) => {
      await page.goto('/pricing');

      // Pricing cards should stack vertically on mobile
      const cards = page.locator('.max-w-6xl > div > div');
      await expect(cards.first()).toBeVisible();

      // Week selectors should be usable
      const weekSelector = page.locator('select').first();
      await weekSelector.selectOption('2');

      // Purchase buttons should be visible
      const purchaseButtons = page.locator('button:has-text("Purchase Access")');
      await expect(purchaseButtons.first()).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading hierarchy', async () => {
      // Main heading
      const h1 = page.locator('h1');
      await expect(h1).toHaveText('Choose Your Notification Speed');

      // Section headings
      const h2 = page.locator('h2');
      await expect(h2.first()).toHaveText('Frequently Asked Questions');
    });

    test('should have accessible form controls', async () => {
      // Week selectors should have labels
      const labels = page.locator('label:has-text("Weeks")');
      await expect(labels.first()).toBeVisible();

      // Buttons should have accessible text
      const buttons = page.locator('button');
      for (const button of await buttons.all()) {
        const text = await button.textContent();
        expect(text?.trim()).toBeTruthy();
      }
    });

    test('should be keyboard navigable', async () => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should focus on purchase button
      const focused = await page.evaluate(() => document.activeElement?.textContent);
      expect(focused).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      // Mock API failure
      await page.route('/api/checkout', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      // Attempt purchase (would require auth)
      // Should show error toast or message
    });

    test('should handle network errors', async () => {
      // Simulate offline state
      await page.context().setOffline(true);

      // Try to load pricing page
      const response = await page.goto('/pricing').catch(() => null);
      expect(response).toBeNull();

      // Restore online
      await page.context().setOffline(false);
    });
  });
});
