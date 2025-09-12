const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Browser Error:', msg.text());
    }
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.error('Page Error:', error.message);
  });
  
  try {
    console.log('🔍 Checking demo page status...');
    
    await page.goto('http://localhost:5173/main/demo', { waitUntil: 'networkidle' });
    console.log('✅ Page loaded successfully');
    
    // Take a screenshot to see what's actually rendered
    await page.screenshot({ path: 'demo-current-state.png', fullPage: true });
    console.log('📸 Screenshot saved as demo-current-state.png');
    
    // Check what's actually on the page
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    const bodyText = await page.locator('body').textContent();
    console.log('📝 Page contains text:', bodyText ? 'Yes' : 'No');
    
    // Check for React errors
    const errorBoundaryText = await page.locator('text="오류가 발생했습니다"').count();
    if (errorBoundaryText > 0) {
      console.log('❌ React error boundary triggered');
    }
    
    // Check if the original demo is loading instead
    const originalDemoText = await page.locator('text="라이어 게임"').count();
    console.log('🎮 Game title found:', originalDemoText > 0 ? 'Yes' : 'No');
    
    // Check specific enhanced features
    const enhancedFeatures = {
      tooltips: await page.locator('[role="tooltip"]').count(),
      dialogs: await page.locator('[role="dialog"]').count(),
      progressbars: await page.locator('[role="progressbar"]').count(),
      buttons: await page.locator('.game-button').count(),
      cards: await page.locator('.game-card').count(),
    };
    
    console.log('🚀 Enhanced features detected:', enhancedFeatures);
    
    // Wait a bit longer to see if dynamic content loads
    await page.waitForTimeout(5000);
    
    console.log('✅ Demo status check completed');
    
  } catch (error) {
    console.error('❌ Error checking demo:', error.message);
  } finally {
    await browser.close();
  }
})();