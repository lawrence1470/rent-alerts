import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Alert Creation Workflow
 * Tests the complete user journey from start to finish
 */

test.describe('Alert Creation Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    // Navigate to alerts page
    await page.goto('/alerts');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display empty state when no alerts exist', async () => {
    // Check for empty state elements
    await expect(page.locator('text=No alerts yet')).toBeVisible();
    await expect(page.locator('text=Create Your First Alert')).toBeVisible();
  });

  test('should open alert creation modal when clicking create button', async () => {
    // Click the create alert button
    await page.click('button:has-text("Create Alert")');

    // Wait for modal to appear with animation
    await page.waitForTimeout(500);

    // Check if modal is visible
    await expect(page.locator('text=Create Rental Alert - Step 1 of 3')).toBeVisible();
  });

  test('should complete full alert creation workflow', async () => {
    // Start creation process
    await page.click('button:has-text("Create Alert")');
    await page.waitForTimeout(500);

    // Step 1: Enter alert name
    await expect(page.locator('text=Create Rental Alert - Step 1 of 3')).toBeVisible();
    await page.fill('input[placeholder*="2-bedroom"]', 'My Dream Brooklyn Apartment');

    // Verify Next button is enabled after entering name
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // Step 2: Select neighborhoods
    await expect(page.locator('text=Create Rental Alert - Step 2 of 3')).toBeVisible();

    // Select Brooklyn neighborhoods
    await page.click('text=Brooklyn');
    await page.waitForTimeout(200);
    await page.click('input[type="checkbox"]:near(:text("Williamsburg"))');
    await page.click('input[type="checkbox"]:near(:text("Greenpoint"))');
    await page.click('input[type="checkbox"]:near(:text("Park Slope"))');

    await page.click('button:has-text("Next")');

    // Step 3: Set filters
    await expect(page.locator('text=Create Rental Alert - Step 3 of 3')).toBeVisible();

    // Set price range
    await page.fill('input[placeholder*="min price"]', '2000');
    await page.fill('input[placeholder*="max price"]', '3500');

    // Set bedrooms
    await page.fill('input[placeholder*="min beds"]', '2');
    await page.fill('input[placeholder*="max beds"]', '3');

    // Set bathrooms
    await page.fill('input[placeholder*="min baths"]', '1');

    // Enable rent stabilization filter
    await page.click('label:has-text("Check if rent stabilized")');

    // Verify disclaimer appears
    await expect(page.locator('text=We use NYC PLUTO data')).toBeVisible();

    // Submit the form
    await page.click('button:has-text("Create Alert")');

    // Wait for loading state
    await expect(page.locator('button:has-text("Creating...")')).toBeVisible();

    // Wait for success state
    await expect(page.locator('button:has-text("Created!")')).toBeVisible({ timeout: 10000 });

    // Verify success toast
    await expect(page.locator('text=Alert created!')).toBeVisible();
  });

  test('should validate required fields', async () => {
    await page.click('button:has-text("Create Alert")');
    await page.waitForTimeout(500);

    // Step 1: Try to proceed without name
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeDisabled();

    // Enter name
    await page.fill('input[placeholder*="2-bedroom"]', 'Test Alert');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // Step 2: Try to proceed without selecting neighborhoods
    await expect(page.locator('button:has-text("Next")')).toBeDisabled();

    // Select at least one neighborhood
    await page.click('text=Manhattan');
    await page.click('input[type="checkbox"]:near(:text("Upper East Side"))');
    await expect(page.locator('button:has-text("Next")')).toBeEnabled();
  });

  test('should allow navigation between steps', async () => {
    await page.click('button:has-text("Create Alert")');
    await page.waitForTimeout(500);

    // Go to step 2
    await page.fill('input[placeholder*="2-bedroom"]', 'Test Alert');
    await page.click('button:has-text("Next")');

    // Go back to step 1
    await page.click('button:has-text("Back")');
    await expect(page.locator('text=Create Rental Alert - Step 1 of 3')).toBeVisible();

    // Verify data persistence
    const nameInput = page.locator('input[placeholder*="2-bedroom"]');
    await expect(nameInput).toHaveValue('Test Alert');

    // Go forward again
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Create Rental Alert - Step 2 of 3')).toBeVisible();
  });

  test('should close modal when clicking cancel', async () => {
    await page.click('button:has-text("Create Alert")');
    await page.waitForTimeout(500);

    // Click cancel button
    await page.click('button:has-text("Cancel")');

    // Modal should close
    await expect(page.locator('text=Create Rental Alert - Step 1 of 3')).not.toBeVisible();
  });

  test('should close modal when clicking outside', async () => {
    await page.click('button:has-text("Create Alert")');
    await page.waitForTimeout(500);

    // Click outside the modal (on the overlay)
    await page.click('.fixed.inset-0', { position: { x: 10, y: 10 } });

    // Modal should close
    await expect(page.locator('text=Create Rental Alert - Step 1 of 3')).not.toBeVisible();
  });

  test('should display rent stabilization probability correctly', async () => {
    await page.click('button:has-text("Create Alert")');
    await page.waitForTimeout(500);

    // Navigate to step 3
    await page.fill('input[placeholder*="2-bedroom"]', 'Test Alert');
    await page.click('button:has-text("Next")');

    await page.click('text=Brooklyn');
    await page.click('input[type="checkbox"]:near(:text("Williamsburg"))');
    await page.click('button:has-text("Next")');

    // Enable rent stabilization filter
    const rentStabilizedCheckbox = page.locator('input[type="checkbox"]:near(:text("Check if rent stabilized"))');
    await rentStabilizedCheckbox.click();

    // Check that disclaimer contains key information
    const disclaimer = page.locator('text=We use NYC PLUTO data');
    await expect(disclaimer).toBeVisible();
    await expect(page.locator('text=/6\\+ units.*built before 1974/')).toBeVisible();
  });

  test('should handle API errors gracefully', async () => {
    // Mock API to return error
    await page.route('/api/alerts', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.click('button:has-text("Create Alert")');
    await page.waitForTimeout(500);

    // Complete the form
    await page.fill('input[placeholder*="2-bedroom"]', 'Test Alert');
    await page.click('button:has-text("Next")');

    await page.click('text=Brooklyn');
    await page.click('input[type="checkbox"]:near(:text("Williamsburg"))');
    await page.click('button:has-text("Next")');

    // Submit
    await page.click('button:has-text("Create Alert")');

    // Should show error state
    await expect(page.locator('button:has-text("Failed")')).toBeVisible({ timeout: 10000 });

    // Should show error toast
    await expect(page.locator('text=Failed to create alert')).toBeVisible();
  });
});

test.describe('Mobile Responsive Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should work on mobile devices', async ({ page }) => {
    await page.goto('/alerts');

    // Mobile navigation should work
    await expect(page.locator('text=No alerts yet')).toBeVisible();

    // Open modal
    await page.click('button:has-text("Create Your First Alert")');
    await page.waitForTimeout(500);

    // Modal should be full-screen on mobile
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    // Complete a simple flow
    await page.fill('input[placeholder*="2-bedroom"]', 'Mobile Test');
    await page.click('button:has-text("Next")');

    // Should be able to scroll through neighborhoods on mobile
    await page.click('text=Manhattan');
    await page.scrollTo(0, 200);
    await page.click('input[type="checkbox"]:near(:text("SoHo"))');
  });
});

test.describe('Accessibility Tests', () => {
  test('should have proper focus management', async ({ page }) => {
    await page.goto('/alerts');

    // Tab through interface
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should focus on Create Alert button
    const createButton = page.locator('button:has-text("Create Alert")');
    await expect(createButton).toBeFocused();

    // Open modal with Enter key
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Focus should be trapped in modal
    const firstInput = page.locator('input[placeholder*="2-bedroom"]');
    await expect(firstInput).toBeFocused();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/alerts');
    await page.click('button:has-text("Create Alert")');
    await page.waitForTimeout(500);

    // Check for ARIA labels
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    // Form inputs should have labels
    const nameInput = page.locator('input[placeholder*="2-bedroom"]');
    const label = await nameInput.getAttribute('aria-label');
    expect(label || await page.locator('label[for]').first().textContent()).toBeTruthy();
  });
});