const { chromium } = require('playwright');

async function diagnoseCssIssues() {
  console.log('🔍 CSS Issue Diagnosis Tool\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check 1: Component Import Issues
    console.log('1️⃣ Checking Component Imports...');
    const componentCheck = await page.evaluate(() => {
      // Look for React component error boundaries or error messages
      const errors = Array.from(document.querySelectorAll('*'))
        .filter(el => el.textContent && (
          el.textContent.includes('Error') ||
          el.textContent.includes('Cannot resolve') ||
          el.textContent.includes('Module not found')
        ));
      
      // Check if components are rendering as expected
      const button = document.querySelector('button[type="submit"]');
      const card = document.querySelector('div[class*="Card"]') || document.querySelector('.card');
      const input = document.querySelector('input[placeholder*="닉네임"]');
      
      return {
        hasErrors: errors.length > 0,
        errorMessages: errors.map(el => el.textContent.trim()).slice(0, 5),
        components: {
          button: button ? {
            className: button.className,
            styles: getComputedStyle(button).cssText.substring(0, 200)
          } : null,
          card: card ? {
            className: card.className,
            styles: getComputedStyle(card).cssText.substring(0, 200)
          } : null,
          input: input ? {
            className: input.className,
            styles: getComputedStyle(input).cssText.substring(0, 200)
          } : null
        }
      };
    });

    if (componentCheck.hasErrors) {
      console.log('❌ Component Errors Detected:');
      componentCheck.errorMessages.forEach(msg => console.log(`   - ${msg}`));
    } else {
      console.log('✅ No obvious component errors detected');
    }

    // Check 2: CSS File Loading
    console.log('\n2️⃣ Checking CSS File Loading...');
    const cssCheck = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      const cssInfo = stylesheets.map(sheet => {
        try {
          return {
            href: sheet.href || 'inline',
            rulesCount: sheet.cssRules ? sheet.cssRules.length : 'inaccessible',
            disabled: sheet.disabled
          };
        } catch (e) {
          return {
            href: sheet.href || 'inline',
            rulesCount: 'error',
            disabled: sheet.disabled,
            error: e.message
          };
        }
      });

      return {
        totalStylesheets: stylesheets.length,
        stylesheets: cssInfo
      };
    });

    console.log(`   Total stylesheets: ${cssCheck.totalStylesheets}`);
    cssCheck.stylesheets.forEach((sheet, i) => {
      console.log(`   ${i + 1}. ${sheet.href} - ${sheet.rulesCount} rules ${sheet.disabled ? '(DISABLED)' : ''}`);
      if (sheet.error) console.log(`      Error: ${sheet.error}`);
    });

    // Check 3: Tailwind CSS Classes
    console.log('\n3️⃣ Checking Tailwind CSS Application...');
    const tailwindCheck = await page.evaluate(() => {
      // Test specific Tailwind classes
      const testDiv = document.createElement('div');
      testDiv.className = 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 shadow-lg rounded-lg p-4';
      document.body.appendChild(testDiv);
      
      const computedStyle = getComputedStyle(testDiv);
      const results = {
        background: computedStyle.background,
        backgroundImage: computedStyle.backgroundImage,
        boxShadow: computedStyle.boxShadow,
        borderRadius: computedStyle.borderRadius,
        padding: computedStyle.padding
      };
      
      document.body.removeChild(testDiv);
      return results;
    });

    console.log('   Tailwind Test Results:');
    Object.entries(tailwindCheck).forEach(([prop, value]) => {
      const isWorking = value !== 'initial' && value !== 'normal' && value !== 'none' && value !== '0px';
      console.log(`   ${prop}: ${isWorking ? '✅' : '❌'} ${value}`);
    });

    // Check 4: Console Errors
    console.log('\n4️⃣ Checking Browser Console...');
    const logs = [];
    page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => logs.push(`ERROR: ${err.message}`));
    
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    if (logs.length > 0) {
      console.log('   Recent console messages:');
      logs.slice(-10).forEach(log => console.log(`   ${log}`));
    } else {
      console.log('   ✅ No console errors detected');
    }

    // Check 5: Network Requests
    console.log('\n5️⃣ Checking Network Requests...');
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('.css') || response.url().includes('.js')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('   CSS/JS Resource Loading:');
    responses.forEach(resp => {
      const status = resp.status < 300 ? '✅' : '❌';
      console.log(`   ${status} ${resp.status} ${resp.url.split('/').pop()}`);
    });

    // Final Component Analysis
    console.log('\n6️⃣ Final Component Analysis...');
    console.log('   Button Component:', componentCheck.components.button ? '✅ Found' : '❌ Missing');
    console.log('   Card Component:', componentCheck.components.card ? '✅ Found' : '❌ Missing');
    console.log('   Input Component:', componentCheck.components.input ? '✅ Found' : '❌ Missing');

    // Generate diagnosis
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    
    const issues = [];
    if (componentCheck.hasErrors) issues.push('Component import/export errors');
    if (cssCheck.totalStylesheets < 2) issues.push('Insufficient CSS files loaded');
    if (!componentCheck.components.card) issues.push('Card component not rendering');
    if (logs.some(log => log.includes('ERROR'))) issues.push('JavaScript runtime errors');
    
    if (issues.length === 0) {
      console.log('✅ No major issues detected - CSS might be working correctly');
      console.log('   The styling issue might be related to specific component implementations');
    } else {
      console.log('❌ Issues detected:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  diagnoseCssIssues();
}

module.exports = { diagnoseCssIssues };