const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 배경 속성 상세 분석...');
    
    await page.goto('http://localhost:5173/main/demo', { waitUntil: 'networkidle' });
    
    // 배경 관련 속성들 확인
    const backgroundInfo = await page.evaluate(() => {
      const gameContainer = document.querySelector('.game-demo-container');
      const style = window.getComputedStyle(gameContainer);
      
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        background: style.background,
        hasGameContainer: gameContainer !== null,
        cssVariableValue: window.getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim(),
        elementStyles: {
          width: style.width,
          height: style.height,
          minHeight: style.minHeight
        }
      };
    });
    
    console.log('🎨 게임 컨테이너 배경 정보:', backgroundInfo);
    
    // 테마 토글 후 변화 확인
    console.log('\n🔄 테마 토글 테스트...');
    
    // 테마 버튼 찾기 및 클릭
    const themeButton = await page.locator('button').filter({ hasText: /테마|라이트|다크|Light|Dark/i }).first();
    if (await themeButton.count() === 0) {
      // 아이콘만 있는 버튼 찾기
      const allButtons = await page.$$('button');
      for (let i = 0; i < allButtons.length; i++) {
        const ariaLabel = await allButtons[i].getAttribute('aria-label');
        if (ariaLabel && ariaLabel.includes('테마')) {
          await allButtons[i].click();
          break;
        }
      }
    } else {
      await themeButton.click();
    }
    
    await page.waitForTimeout(1000);
    
    // 토글 후 상태
    const afterToggle = await page.evaluate(() => {
      const gameContainer = document.querySelector('.game-demo-container');
      const style = window.getComputedStyle(gameContainer);
      
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        background: style.background,
        cssVariableValue: window.getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim()
      };
    });
    
    console.log('🎨 토글 후 배경 정보:', afterToggle);
    
    if (backgroundInfo.cssVariableValue !== afterToggle.cssVariableValue) {
      console.log('✅ CSS 변수 변경 확인됨');
    } else {
      console.log('❌ CSS 변수 변경되지 않음');
    }
    
    if (backgroundInfo.background !== afterToggle.background) {
      console.log('✅ 배경 스타일 변경 확인됨');
    } else {
      console.log('❌ 배경 스타일 변경되지 않음');
    }
    
  } catch (error) {
    console.error('❌ 배경 분석 오류:', error);
  } finally {
    await browser.close();
  }
})();