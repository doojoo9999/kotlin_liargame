const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to demo page
    await page.goto('http://localhost:5173/main/demo', { waitUntil: 'networkidle' });
    
    // Wait for page to fully load
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'demo-page-current.png', fullPage: true });
    
    // Analyze page structure
    const analysis = await page.evaluate(() => {
      // Check for interactive elements
      const buttons = document.querySelectorAll('button').length;
      const cards = document.querySelectorAll('[class*="card"], .game-card').length;
      const progressBars = document.querySelectorAll('[class*="progress"]').length;
      const icons = document.querySelectorAll('svg').length;
      
      // Check for animations and transitions
      const animatedElements = document.querySelectorAll('[class*="animate"], [style*="animation"]').length;
      
      // Check for responsive design elements
      const responsiveElements = document.querySelectorAll('[style*="grid"], [style*="flex"]').length;
      
      // Check for accessibility features
      const ariaElements = document.querySelectorAll('[aria-label], [role]').length;
      
      // Check for color scheme and theming
      const styledElements = document.querySelectorAll('[style]').length;
      
      return {
        interactivity: {
          buttons,
          cards,
          progressBars,
          icons
        },
        animations: {
          animatedElements
        },
        layout: {
          responsiveElements
        },
        accessibility: {
          ariaElements
        },
        styling: {
          styledElements
        },
        pageStructure: {
          sections: document.querySelectorAll('section, aside, main').length,
          navigation: document.querySelectorAll('nav, [role="navigation"]').length
        }
      };
    });
    
    console.log('=== DEMO PAGE ANALYSIS ===');
    console.log(JSON.stringify(analysis, null, 2));
    
    // Test different sections
    const sections = ['overview', 'components', 'players'];
    for (const section of sections) {
      try {
        // Click on section navigation
        await page.click(`button:has-text("${section === 'overview' ? 'Overview' : section === 'components' ? 'Components' : 'Players'}")`, { timeout: 5000 });
        await page.waitForTimeout(1000);
        
        // Take screenshot of each section
        await page.screenshot({ path: `demo-${section}-section.png`, fullPage: true });
      } catch (error) {
        console.log(`Could not navigate to ${section} section:`, error.message);
      }
    }
    
    // Check for missing features
    const missingFeatures = await page.evaluate(() => {
      const issues = [];
      
      // Check for loading states
      const loadingElements = document.querySelectorAll('[class*="loading"], [class*="skeleton"]');
      if (loadingElements.length === 0) {
        issues.push('No loading states detected');
      }
      
      // Check for error handling
      const errorElements = document.querySelectorAll('[class*="error"], [role="alert"]');
      if (errorElements.length === 0) {
        issues.push('No error handling UI detected');
      }
      
      // Check for tooltips
      const tooltipElements = document.querySelectorAll('[title], [aria-describedby]');
      if (tooltipElements.length === 0) {
        issues.push('No tooltips detected');
      }
      
      // Check for modals/dialogs
      const modalElements = document.querySelectorAll('[role="dialog"], .modal');
      if (modalElements.length === 0) {
        issues.push('No modal dialogs detected');
      }
      
      // Check for form validation
      const formElements = document.querySelectorAll('form, input, textarea');
      if (formElements.length === 0) {
        issues.push('No interactive forms detected');
      }
      
      return issues;
    });
    
    console.log('\n=== POTENTIAL IMPROVEMENTS ===');
    missingFeatures.forEach((feature, index) => {
      console.log(`${index + 1}. ${feature}`);
    });
    
  } catch (error) {
    console.error('Error analyzing demo page:', error);
  } finally {
    await browser.close();
  }
})();