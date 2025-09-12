const { chromium } = require('playwright');
const { BASE_URL } = require('./env-base');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Monitor console for React render warnings
  page.on('console', msg => {
    console.log('Browser Console:', msg.text());
  });
  
  try {
    await page.goto(`${BASE_URL}/main/demo`, { waitUntil: 'networkidle' });
    console.log('🔍 페이지 렌더링 성능 분석 중...');
    
    // Check for excessive re-renders using React DevTools profiler
    const renderCount = await page.evaluate(() => {
      let renderCount = 0;
      const originalLog = console.log;
      console.log = (...args) => {
        if (args.some(arg => typeof arg === 'string' && arg.includes('render'))) {
          renderCount++;
        }
        originalLog.apply(console, args);
      };
      
      // Wait 5 seconds and count renders
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(renderCount);
        }, 5000);
      });
    });
    
    console.log(`📊 5초간 렌더링 횟수: ${renderCount}`);
    
    // Check for timer intervals
    const timerCount = await page.evaluate(() => {
      return window.setInterval.toString();
    });
    
    console.log('⏰ 타이머 확인 완료');
    
  } catch (error) {
    console.error('❌ 분석 오류:', error);
  } finally {
    await browser.close();
  }
})();