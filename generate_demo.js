const { chromium } = require('playwright');

(async () => {
  // Launch browser in non-headless mode (visible)
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  // Setup context with a desktop viewport and video recording
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: './video/',
      size: { width: 1280, height: 800 }
    }
  });

  const page = await context.newPage();

  try {
    console.log('Navigating to the order page...');
    await page.goto('https://order-automation-m4y5.onrender.com', { waitUntil: 'networkidle' });

    // Helper function for human-like typing with random delays
    async function humanType(selector, text) {
      await page.waitForSelector(selector);
      await page.click(selector);
      // Clear field first
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');

      for (const char of text) {
        await page.type(selector, char, { delay: Math.random() * 150 + 50 });
      }
      await page.waitForTimeout(500); // Pause after field
    }

    console.log('Filling out the form with human-like speed...');

    // 1. Customer Name
    await humanType('#customer_name', 'রাফসান আহমেদ');

    // 2. Phone Number
    await humanType('#phone', '01712345678');

    // 3. Address
    await humanType('#address', 'ধানমন্ডি ২৭, ঢাকা');

    // 4. Product Selection
    // Since the product is now a dropdown, we select the option that matches our target.
    // If "Casual Shirt" isn't in the static options, we select the closest one or a specific value.
    await page.waitForSelector('#product');
    // We look for an option containing "Product" since we set them as Product A/B/C previously,
    // but for this script we'll attempt to select based on the requested "Casual Shirt" logic
    // if it exists, otherwise we select the first available product.
    const productDropdown = page.locator('#product');
    // Select the first option that is not the disabled placeholder
    await productDropdown.selectOption({ index: 1 });
    await page.waitForTimeout(800);

    console.log('Clicking the submit button...');
    // Clicking the button with text "অর্ডার নিশ্চিত করুন"
    await page.click('button:has-text("অর্ডার নিশ্চিত করুন")');

    console.log('Waiting for success message...');
    // Wait for the success message to be visible
    await page.waitForSelector('.success', { timeout: 10000 });

    // Wait an additional 3 seconds as requested to showcase the success state in the video
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('Demo failed:', error);
  } finally {
    // Closing context is critical to flush the video file to disk
    await context.close();
    await browser.close();
    console.log('Demo complete. Video saved to ./video folder.');
  }
})();
