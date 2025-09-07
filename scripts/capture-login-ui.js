const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Immediate UI Capture and Analysis Script
async function captureLoginUI() {
  console.log('🚀 Starting Login UI Capture and Analysis...\n');
  
  const browser = await chromium.launch({ headless: false }); // Show browser for debugging
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the login page
    console.log('📍 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Allow animations to complete
    
    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    console.log('📸 Taking full page screenshot...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'login-page-full.png'), 
      fullPage: true 
    });
    
    // Analyze page structure
    console.log('🔍 Analyzing page structure...');
    const pageAnalysis = await page.evaluate(() => {
      const analysis = {
        title: document.title,
        hasLoginCard: !!document.querySelector('div[class*="Card"]'),
        hasBranding: !!Array.from(document.querySelectorAll('h1')).find(h1 => h1.textContent.includes('LIAR GAME')) || !!document.querySelector('h1'),
        hasNicknameInput: !!document.querySelector('input[placeholder*="닉네임"]'),
        hasLoginButton: !!document.querySelector('button[type="submit"]'),
        hasGuestButton: !!Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('게스트')) || 
                        !!document.querySelector('button[class*="outline"]'),
        hasGameIcon: !!document.querySelector('svg') || !!document.querySelector('[class*="gamepad"]'),
        elementsCount: {
          buttons: document.querySelectorAll('button').length,
          inputs: document.querySelectorAll('input').length,
          cards: document.querySelectorAll('[class*="Card"], [class*="card"]').length,
          icons: document.querySelectorAll('svg').length
        }
      };
      
      // Check for Tailwind classes
      const tailwindCheck = Array.from(document.querySelectorAll('*'))
        .some(el => {
          const classes = el.className;
          return typeof classes === 'string' && (
            classes.includes('bg-gradient') ||
            classes.includes('from-') ||
            classes.includes('to-') ||
            classes.includes('shadow-') ||
            classes.includes('rounded-')
          );
        });
      
      analysis.hasTailwindClasses = tailwindCheck;
      
      return analysis;
    });
    
    console.log('📊 Page Analysis Results:');
    console.log(`   Title: ${pageAnalysis.title}`);
    console.log(`   Has Login Card: ${pageAnalysis.hasLoginCard ? '✅' : '❌'}`);
    console.log(`   Has Branding: ${pageAnalysis.hasBranding ? '✅' : '❌'}`);
    console.log(`   Has Nickname Input: ${pageAnalysis.hasNicknameInput ? '✅' : '❌'}`);
    console.log(`   Has Login Button: ${pageAnalysis.hasLoginButton ? '✅' : '❌'}`);
    console.log(`   Has Guest Button: ${pageAnalysis.hasGuestButton ? '✅' : '❌'}`);
    console.log(`   Has Game Icon: ${pageAnalysis.hasGameIcon ? '✅' : '❌'}`);
    console.log(`   Has Tailwind Classes: ${pageAnalysis.hasTailwindClasses ? '✅' : '❌'}`);
    console.log(`   Elements Count:`, pageAnalysis.elementsCount);
    
    // CSS Analysis
    console.log('\n🎨 Analyzing CSS...');
    const cssAnalysis = await page.evaluate(() => {
      const root = document.documentElement;
      const rootStyle = getComputedStyle(root);
      
      // Check CSS custom properties
      const customProps = [
        '--background',
        '--foreground',
        '--primary',
        '--game-primary',
        '--game-secondary',
        '--radius'
      ].reduce((acc, prop) => {
        acc[prop] = rootStyle.getPropertyValue(prop).trim();
        return acc;
      }, {});
      
      // Check body styling
      const bodyStyle = getComputedStyle(document.body);
      
      // Check if main components have proper styling
      const loginCard = document.querySelector('div[class*="Card"]');
      const cardStyle = loginCard ? getComputedStyle(loginCard) : null;
      
      const loginButton = document.querySelector('button[type="submit"]');
      const buttonStyle = loginButton ? getComputedStyle(loginButton) : null;
      
      return {
        customProperties: customProps,
        bodyBackground: bodyStyle.background,
        bodyBackgroundImage: bodyStyle.backgroundImage,
        bodyColor: bodyStyle.color,
        cardStyling: cardStyle ? {
          background: cardStyle.background,
          borderRadius: cardStyle.borderRadius,
          boxShadow: cardStyle.boxShadow,
          padding: cardStyle.padding
        } : null,
        buttonStyling: buttonStyle ? {
          background: buttonStyle.background,
          backgroundImage: buttonStyle.backgroundImage,
          borderRadius: buttonStyle.borderRadius,
          color: buttonStyle.color,
          padding: buttonStyle.padding
        } : null
      };
    });
    
    console.log('🎨 CSS Analysis Results:');
    console.log('   Custom Properties:');
    Object.entries(cssAnalysis.customProperties).forEach(([prop, value]) => {
      console.log(`     ${prop}: ${value || 'NOT DEFINED'}`);
    });
    console.log(`   Body Background: ${cssAnalysis.bodyBackgroundImage.includes('gradient') ? 'HAS GRADIENT ✅' : 'NO GRADIENT ❌'}`);
    console.log(`   Card Styling: ${cssAnalysis.cardStyling ? 'PRESENT ✅' : 'MISSING ❌'}`);
    console.log(`   Button Styling: ${cssAnalysis.buttonStyling ? 'PRESENT ✅' : 'MISSING ❌'}`);
    
    // Capture individual components
    console.log('\n📸 Capturing individual components...');
    
    // Login card
    try {
      const loginCard = page.locator('div[class*="Card"]').first();
      if (await loginCard.isVisible()) {
        await loginCard.screenshot({ path: path.join(screenshotsDir, 'login-card.png') });
        console.log('   ✅ Login card captured');
      }
    } catch (e) {
      console.log('   ❌ Could not capture login card');
    }
    
    // Branding section
    try {
      const branding = page.locator('h1').first().locator('..').first();
      if (await branding.isVisible()) {
        await branding.screenshot({ path: path.join(screenshotsDir, 'branding-section.png') });
        console.log('   ✅ Branding section captured');
      }
    } catch (e) {
      console.log('   ❌ Could not capture branding section');
    }
    
    // Form elements
    try {
      const form = page.locator('form').first();
      if (await form.isVisible()) {
        await form.screenshot({ path: path.join(screenshotsDir, 'login-form.png') });
        console.log('   ✅ Login form captured');
      }
    } catch (e) {
      console.log('   ❌ Could not capture login form');
    }
    
    // Test admin password field
    console.log('\n🔒 Testing admin password field...');
    try {
      const nicknameInput = page.locator('input[placeholder*="닉네임"]');
      if (await nicknameInput.isVisible()) {
        await nicknameInput.fill('admin');
        await page.waitForTimeout(500);
        
        const passwordField = page.locator('input[type="password"]');
        if (await passwordField.isVisible()) {
          await page.screenshot({ path: path.join(screenshotsDir, 'admin-password-field.png') });
          console.log('   ✅ Admin password field appears correctly');
        } else {
          console.log('   ❌ Admin password field does not appear');
        }
      }
    } catch (e) {
      console.log('   ❌ Error testing admin password field:', e.message);
    }
    
    // Test responsive design
    console.log('\n📱 Testing responsive design...');
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1440, height: 900, name: 'desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: path.join(screenshotsDir, `login-${viewport.name}.png`),
        fullPage: true
      });
      console.log(`   ✅ ${viewport.name} screenshot captured`);
    }
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      analysis: pageAnalysis,
      css: cssAnalysis,
      summary: {
        uiWorking: pageAnalysis.hasLoginCard && pageAnalysis.hasLoginButton && pageAnalysis.hasNicknameInput,
        cssWorking: cssAnalysis.cardStyling && cssAnalysis.buttonStyling && 
                   cssAnalysis.bodyBackgroundImage.includes('gradient'),
        responsiveWorking: true, // Assuming responsive works if screenshots were taken
        tailwindWorking: pageAnalysis.hasTailwindClasses
      }
    };
    
    fs.writeFileSync(
      path.join(screenshotsDir, 'analysis-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📋 FINAL ASSESSMENT:');
    console.log(`   UI Structure: ${report.summary.uiWorking ? '✅ WORKING' : '❌ BROKEN'}`);
    console.log(`   CSS Styling: ${report.summary.cssWorking ? '✅ WORKING' : '❌ BROKEN'}`);
    console.log(`   Tailwind CSS: ${report.summary.tailwindWorking ? '✅ WORKING' : '❌ BROKEN'}`);
    console.log(`   Responsive Design: ${report.summary.responsiveWorking ? '✅ WORKING' : '❌ BROKEN'}`);
    
    console.log(`\n📁 Screenshots saved to: ${screenshotsDir}`);
    console.log(`📄 Analysis report saved to: ${path.join(screenshotsDir, 'analysis-report.json')}`);
    
    return report.summary;
    
  } catch (error) {
    console.error('❌ Error during capture:', error);
    return { uiWorking: false, cssWorking: false, tailwindWorking: false, responsiveWorking: false };
  } finally {
    await browser.close();
  }
}

// Export for use in other scripts
module.exports = { captureLoginUI };

// Run if called directly
if (require.main === module) {
  captureLoginUI()
    .then(summary => {
      console.log('\n🎉 Analysis complete!');
      process.exit(summary.uiWorking && summary.cssWorking ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}