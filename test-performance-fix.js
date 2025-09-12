const { chromium } = require('playwright');
const { BASE_URL } = require('./env-base');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔧 성능 최적화 후 테스트...');
    
    await page.goto(`${BASE_URL}/main/demo`, { waitUntil: 'networkidle' });
    console.log('✅ 페이지 로드 완료');
    
    // Monitor for 10 seconds to see if page keeps refreshing
    console.log('⏱️ 10초간 렌더링 안정성 모니터링...');
    
    let refreshCount = 0;
    page.on('framenavigated', () => {
      refreshCount++;
      console.log(`🔄 페이지 새로고침 감지: ${refreshCount}회`);
    });
    
    // Wait for 10 seconds
    await page.waitForTimeout(10000);
    
    if (refreshCount === 0) {
      console.log('✅ 성능 최적화 성공! 불필요한 새로고침이 없습니다.');
    } else {
      console.log(`❌ 여전히 ${refreshCount}회의 새로고침이 발생했습니다.`);
    }
    
    // Check if timer is still working
    const timerExists = await page.locator('[style*="monospace"]').count();
    console.log(`⏰ 타이머 표시: ${timerExists > 0 ? '정상' : '없음'}`);
    
    // Take screenshot
    await page.screenshot({ path: 'demo-performance-optimized.png' });
    console.log('📸 최적화된 데모 스크린샷 저장');
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
  } finally {
    await browser.close();
  }
})();