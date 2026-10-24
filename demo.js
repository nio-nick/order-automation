const { chromium } = require('playwright');

(async () => {
  // Launch browser in headed mode to see the action
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  // Create a browser context that records video
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: './videos/',
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();

  try {
    console.log('Opening the live site...');
    await page.goto('https://order-automation-m4y5.onrender.com', { waitUntil: 'networkidle' });

    // Helper function for human-like typing
    async function humanType(selector, text) {
      await page.waitForSelector(selector);
      await page.click(selector);
      for (const char of text) {
        await page.type(selector, char, { delay: Math.random() * 100 + 50 });
      }
    }

    console.log('Filling out the order form...');

    // Type Customer Name
    await humanType('#customer_name', 'Abir Hasan');

    // Type Phone Number
    await humanType('#phone', '01712345678');

    // Type Address
    await humanType('#address', 'House 12, Road 5, Dhanmondi, Dhaka');

    // Select Product
    // Note: Selects don't use typing, but we'll add a delay for realism
    await page.waitForSelector('#product');
    await page.selectOption('#product', 'Product B|2000');
    await page.waitForTimeout(1000);

    console.log('Submitting order...');
    await page.click('button[type="submit"]');

    // Wait for success message (looking for the success class)
    await page.waitForSelector('.success', { timeout: 15000 });
    console.log('Success message detected!');

    // Give it a few seconds to let the video capture the final state
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('An error occurred during the demo:', error);
  } finally {
    // Closing context saves the video
    await context.close();
    await browser.close();
    console.log('Browser closed. Video saved to ./videos/');
  }
})();
