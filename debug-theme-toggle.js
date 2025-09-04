const { chromium } = require('playwright');
const { BASE_URL } = require('./env-base');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 테마 토글 버튼 찾기 및 테스트...');
    
    await page.goto(`${BASE_URL}/main/demo`, { waitUntil: 'networkidle' });

    // 모든 버튼 찾기
    const allButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map((btn, index) => ({
        index,
        text: btn.textContent?.trim().substring(0, 50),
        ariaLabel: btn.getAttribute('aria-label'),
        className: btn.className,
        hasThemeKeyword: btn.textContent?.toLowerCase().includes('테마') || 
                        btn.textContent?.toLowerCase().includes('라이트') ||
                        btn.textContent?.toLowerCase().includes('다크') ||
                        btn.getAttribute('aria-label')?.toLowerCase().includes('테마')
      }));
    });
    
    console.log('🔘 발견된 버튼들:');
    allButtons.forEach(btn => {
      if (btn.hasThemeKeyword) {
        console.log(`   ✅ [${btn.index}] "${btn.text}" (테마 관련)`);
      } else {
        console.log(`   - [${btn.index}] "${btn.text}"`);
      }
    });
    
    // 테마 관련 버튼 찾기
    const themeButtons = allButtons.filter(btn => btn.hasThemeKeyword);
    
    if (themeButtons.length === 0) {
      console.log('❌ 테마 토글 버튼을 찾을 수 없습니다!');
    } else {
      console.log(`\n🎯 테마 버튼 ${themeButtons.length}개 발견:`);
      
      for (const themeBtn of themeButtons) {
        console.log(`\n테스트 중: 버튼 ${themeBtn.index} - "${themeBtn.text}"`);
        
        // 클릭 전 상태
        const beforeClick = await page.evaluate(() => {
          const body = document.body;
          return {
            bodyBg: window.getComputedStyle(body).backgroundColor,
            cssVar: window.getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim()
          };
        });
        
        console.log('   클릭 전:', beforeClick);
        
        // 버튼 클릭
        const buttons = await page.$$('button');
        await buttons[themeBtn.index].click();
        
        // 잠깐 기다리기
        await page.waitForTimeout(1000);
        
        // 클릭 후 상태
        const afterClick = await page.evaluate(() => {
          const body = document.body;
          return {
            bodyBg: window.getComputedStyle(body).backgroundColor,
            cssVar: window.getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim()
          };
        });
        
        console.log('   클릭 후:', afterClick);
        
        if (beforeClick.cssVar !== afterClick.cssVar || beforeClick.bodyBg !== afterClick.bodyBg) {
          console.log('   ✅ 테마 변경 성공!');
          break;
        } else {
          console.log('   ❌ 테마 변경 실패');
        }
      }
    }
    
    // 최종 스크린샷
    await page.screenshot({ path: 'theme-toggle-debug.png', fullPage: true });
    console.log('\n📸 디버그 스크린샷 저장');
    
  } catch (error) {
    console.error('❌ 테마 토글 테스트 오류:', error);
  } finally {
    await browser.close();
  }
})();