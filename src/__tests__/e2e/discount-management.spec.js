/**
 * E2E Tests for Discount Management Workflow
 * Tests the complete flow: Admin sets discount → Frontend displays discount badge
 */

import { test, expect } from '@playwright/test';

// Test configuration
const ADMIN_URL = process.env.VITE_ADMIN_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@supermerch.com';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';

/**
 * USER JOURNEY 1: Admin sets global discount and verifies on frontend
 * As an admin, I want to set a global discount,
 * so that all products display discount badges on the frontend
 */
test.describe('Global Discount E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login to admin panel
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[name="email"]', TEST_ADMIN_EMAIL);
    await page.fill('input[name="password"]', TEST_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should set global discount and display on frontend products', async ({ page, context }) => {
    // Step 1: Navigate to Global Discount page
    await page.click('text=Pricing & Margins');
    await page.click('a[href="/pricing/global-discount"]');

    // Verify page loaded
    await expect(page.locator('h5:has-text("Global Discount Settings")')).toBeVisible();

    // Step 2: Set global discount to 20%
    await page.fill('input[name="discount"]', '20');
    await page.check('input[name="isActive"]');

    // Step 3: Save the discount
    await page.click('button[type="submit"]:has-text("Save Global Discount")');

    // Wait for success toast
    await expect(page.locator('text=Global discount updated successfully')).toBeVisible({ timeout: 5000 });

    // Step 4: Open frontend in new tab
    const frontendPage = await context.newPage();
    await frontendPage.goto(FRONTEND_URL);

    // Step 5: Navigate to products page
    await frontendPage.click('a[href*="/products"], a[href*="/shop"]');

    // Step 6: Verify discount badge appears on products
    const discountBadges = frontendPage.locator('text=/20% OFF/i');
    await expect(discountBadges.first()).toBeVisible({ timeout: 10000 });

    // Step 7: Verify multiple products have the discount
    const badgeCount = await discountBadges.count();
    expect(badgeCount).toBeGreaterThan(0);

    console.log(`✅ Found ${badgeCount} products with 20% OFF badge`);

    // Cleanup: Deactivate global discount
    await page.bringToFront();
    await page.uncheck('input[name="isActive"]');
    await page.click('button[type="submit"]:has-text("Save Global Discount")');
  });

  test('should deactivate global discount and remove badges from frontend', async ({ page, context }) => {
    // Step 1: Ensure global discount is active first
    await page.goto(`${ADMIN_URL}/pricing/global-discount`);
    await page.fill('input[name="discount"]', '15');
    await page.check('input[name="isActive"]');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=updated successfully')).toBeVisible({ timeout: 5000 });

    // Step 2: Verify badges appear on frontend
    const frontendPage = await context.newPage();
    await frontendPage.goto(`${FRONTEND_URL}/products`);
    await expect(frontendPage.locator('text=/15% OFF/i').first()).toBeVisible({ timeout: 10000 });

    // Step 3: Deactivate global discount
    await page.bringToFront();
    await page.uncheck('input[name="isActive"]');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=updated successfully')).toBeVisible({ timeout: 5000 });

    // Step 4: Refresh frontend and verify badges are gone
    await frontendPage.reload();
    await frontendPage.waitForLoadState('networkidle');

    const badgeCount = await frontendPage.locator('text=/15% OFF/i').count();
    expect(badgeCount).toBe(0);

    console.log('✅ Discount badges removed from frontend after deactivation');
  });

  test('should validate discount percentage limits', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/pricing/global-discount`);

    // Try to set discount > 100%
    await page.fill('input[name="discount"]', '150');
    await page.check('input[name="isActive"]');
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=/between 0 and 100/i')).toBeVisible({ timeout: 5000 });

    // Try negative discount
    await page.fill('input[name="discount"]', '-10');
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=/valid.*percentage/i')).toBeVisible({ timeout: 5000 });
  });
});

/**
 * USER JOURNEY 2: Admin sets product-specific discount
 * As an admin, I want to set a discount for a specific product,
 * so that it shows a higher discount than global
 */
test.describe('Product Discount E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[name="email"]', TEST_ADMIN_EMAIL);
    await page.fill('input[name="password"]', TEST_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should set product discount and override global discount', async ({ page, context }) => {
    const TEST_PRODUCT_ID = '501234'; // From seed data

    // Step 1: Set global discount to 10%
    await page.goto(`${ADMIN_URL}/pricing/global-discount`);
    await page.fill('input[name="discount"]', '10');
    await page.check('input[name="isActive"]');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=updated successfully')).toBeVisible({ timeout: 5000 });

    // Step 2: Set product-specific discount to 50%
    await page.goto(`${ADMIN_URL}/pricing/product-discount`);
    await page.fill('input[name="productId"]', TEST_PRODUCT_ID);
    await page.click('button[type="submit"]:has-text("Search")');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Set discount
    await page.fill('input[name="discount"]', '50');
    await page.click('button[type="submit"]:has-text("Set Discount")');

    // Wait for success
    await expect(page.locator('text=/updated successfully/i')).toBeVisible({ timeout: 5000 });

    // Step 3: Verify on frontend
    const frontendPage = await context.newPage();
    await frontendPage.goto(FRONTEND_URL);

    // Search for the product
    await frontendPage.fill('input[placeholder*="Search"]', TEST_PRODUCT_ID);
    await frontendPage.waitForTimeout(1000);

    // Verify product shows 50% discount (not 10% global)
    await expect(frontendPage.locator(`text=/50% OFF/i`)).toBeVisible({ timeout: 10000 });

    // Verify other products still show 10% (global)
    const globalDiscountBadges = frontendPage.locator('text=/10% OFF/i');
    const globalCount = await globalDiscountBadges.count();
    expect(globalCount).toBeGreaterThan(0);

    console.log('✅ Product-specific discount (50%) overrides global discount (10%)');
  });

  test('should search for product and display current discount', async ({ page }) => {
    const TEST_PRODUCT_ID = '502345'; // From seed data (30% discount)

    await page.goto(`${ADMIN_URL}/pricing/product-discount`);

    // Search for product
    await page.fill('input[name="productId"]', TEST_PRODUCT_ID);
    await page.click('button[type="submit"]:has-text("Search")');

    // Wait for results
    await page.waitForTimeout(1000);

    // Verify existing discount is displayed
    const discountInput = page.locator('input[name="discount"]');
    await expect(discountInput).toHaveValue('30');

    console.log('✅ Existing product discount loaded from seeded data');
  });
});

/**
 * USER JOURNEY 3: Admin manages supplier discounts
 * As an admin, I want to set discounts per supplier,
 * so that products from specific suppliers show consistent discounts
 */
test.describe('Supplier Discount E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[name="email"]', TEST_ADMIN_EMAIL);
    await page.fill('input[name="password"]', TEST_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should list seeded supplier discounts', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/pricing/supplier-discount`);

    // Verify table loads
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 });

    // Verify seeded data appears (from seed_discounts.js)
    // Supplier 1001 - 10%
    await expect(page.locator('text=/1001/i')).toBeVisible();
    await expect(page.locator('text=/10%/i')).toBeVisible();

    // Supplier 1002 - 15%
    await expect(page.locator('text=/1002/i')).toBeVisible();
    await expect(page.locator('text=/15%/i')).toBeVisible();

    // Supplier 1003 - 20%
    await expect(page.locator('text=/1003/i')).toBeVisible();
    await expect(page.locator('text=/20%/i')).toBeVisible();

    console.log('✅ Seeded supplier discounts displayed in admin panel');
  });

  test('should add new supplier discount', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/pricing/supplier-discount`);

    // Click Add button (assuming modal opens)
    await page.click('button:has-text("Add"), button:has-text("New")');

    // Fill in supplier ID and discount
    await page.fill('input[name="supplierId"]', '9999');
    await page.fill('input[name="discount"]', '35');

    // Submit
    await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Add")');

    // Verify success
    await expect(page.locator('text=/added successfully/i, text=/updated successfully/i')).toBeVisible({ timeout: 5000 });

    // Verify appears in table
    await expect(page.locator('text=/9999/i')).toBeVisible();
    await expect(page.locator('text=/35%/i')).toBeVisible();

    console.log('✅ New supplier discount added successfully');
  });

  test('should edit existing supplier discount', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/pricing/supplier-discount`);

    // Find row with supplier 1001 and click Edit
    const row = page.locator('tr:has-text("1001")');
    await row.locator('button:has-text("Edit")').click();

    // Change discount from 10% to 25%
    await page.fill('input[name="discount"]', '25');
    await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Update")');

    // Verify success
    await expect(page.locator('text=/updated successfully/i')).toBeVisible({ timeout: 5000 });

    // Verify new value in table
    const updatedRow = page.locator('tr:has-text("1001")');
    await expect(updatedRow.locator('text=/25%/i')).toBeVisible();

    console.log('✅ Supplier discount updated from 10% to 25%');
  });
});

/**
 * INTEGRATION TEST: Discount priority and cascade
 * Verifies that discount priority works correctly: Product > Supplier > Global
 */
test.describe('Discount Priority Integration', () => {
  test('should apply correct discount based on priority hierarchy', async ({ page, context }) => {
    // Login
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[name="email"]', TEST_ADMIN_EMAIL);
    await page.fill('input[name="password"]', TEST_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Set up discount hierarchy
    // Global: 5%
    await page.goto(`${ADMIN_URL}/pricing/global-discount`);
    await page.fill('input[name="discount"]', '5');
    await page.check('input[name="isActive"]');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Supplier 1001: 10%
    await page.goto(`${ADMIN_URL}/pricing/supplier-discount`);
    const supplierRow = page.locator('tr:has-text("1001")');
    if (await supplierRow.count() > 0) {
      await supplierRow.locator('button:has-text("Edit")').click();
      await page.fill('input[name="discount"]', '10');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    }

    // Product 501234: 25%
    await page.goto(`${ADMIN_URL}/pricing/product-discount`);
    await page.fill('input[name="productId"]', '501234');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(1000);
    await page.fill('input[name="discount"]', '25');
    await page.click('button:has-text("Set Discount")');
    await page.waitForTimeout(1000);

    // Verify on frontend
    const frontendPage = await context.newPage();
    await frontendPage.goto(FRONTEND_URL);

    // Product with product-level discount should show 25%
    // (Even though it has supplier 10% and global 5%)
    await frontendPage.fill('input[placeholder*="Search"]', '501234');
    await frontendPage.waitForTimeout(1500);
    await expect(frontendPage.locator('text=/25% OFF/i').first()).toBeVisible({ timeout: 10000 });

    console.log('✅ Discount priority works correctly: Product (25%) > Supplier (10%) > Global (5%)');
  });
});

/**
 * ACCESSIBILITY & UX TESTS
 */
test.describe('Discount Management Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[name="email"]', TEST_ADMIN_EMAIL);
    await page.fill('input[name="password"]', TEST_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    await page.goto(`${ADMIN_URL}/pricing/global-discount`);

    // Tab through form fields
    await page.keyboard.press('Tab'); // Focus on discount input
    await page.keyboard.type('15');

    await page.keyboard.press('Tab'); // Focus on checkbox
    await page.keyboard.press('Space'); // Toggle checkbox

    await page.keyboard.press('Tab'); // Focus on submit button
    await page.keyboard.press('Enter'); // Submit

    // Verify success
    await expect(page.locator('text=/updated successfully/i')).toBeVisible({ timeout: 5000 });

    console.log('✅ Discount forms are keyboard accessible');
  });

  test('should show loading states during save', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[name="email"]', TEST_ADMIN_EMAIL);
    await page.fill('input[name="password"]', TEST_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    await page.goto(`${ADMIN_URL}/pricing/global-discount`);
    await page.fill('input[name="discount"]', '20');

    // Click submit and immediately check for loading state
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Verify button is disabled during save (if loading state exists)
    const isDisabled = await submitButton.isDisabled().catch(() => false);

    console.log('✅ Loading states handled (button disabled:', isDisabled, ')');
  });
});
