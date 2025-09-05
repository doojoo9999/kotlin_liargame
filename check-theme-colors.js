const { chromium } = require('playwright');
const { BASE_URL } = require('./env-base');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🎨 테마 및 색상 상태 확인 중...');
    
    await page.goto(`${BASE_URL}/main/demo`, { waitUntil: 'networkidle' });

    // 테마 및 색상 정보 수집
    const themeInfo = await page.evaluate(() => {
      const body = document.body;
      const root = document.getElementById('root');
      const themeToggle = document.querySelector('[aria-label*="테마"], [data-testid="theme-toggle"], button[class*="theme"]');
      const darkModeToggle = document.querySelector('[aria-label*="다크"], [data-testid="dark-toggle"]');
      
      // 배경색 확인
      const bodyBg = window.getComputedStyle(body).backgroundColor;
      const rootBg = root ? window.getComputedStyle(root).backgroundColor : 'none';
      
      // 버튼들의 색상 확인
      const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent?.trim(),
        backgroundColor: window.getComputedStyle(btn).backgroundColor,
        color: window.getComputedStyle(btn).color,
        hasColor: window.getComputedStyle(btn).backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                  window.getComputedStyle(btn).backgroundColor !== 'transparent'
      }));
      
      // 카드/컨테이너 색상 확인
      const cards = Array.from(document.querySelectorAll('.game-demo-container, [class*="card"], [class*="container"]')).map(card => ({
        className: card.className,
        backgroundColor: window.getComputedStyle(card).backgroundColor,
        hasBackground: window.getComputedStyle(card).backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                       window.getComputedStyle(card).backgroundColor !== 'transparent'
      }));
      
      // 진행바 색상 확인
      const progressBars = Array.from(document.querySelectorAll('[role="progressbar"], [class*="progress"]')).map(bar => ({
        backgroundColor: window.getComputedStyle(bar).backgroundColor,
        color: window.getComputedStyle(bar).color,
        hasColor: window.getComputedStyle(bar).backgroundColor !== 'rgba(0, 0, 0, 0)'
      }));
      
      return {
        hasThemeToggle: themeToggle !== null,
        hasDarkModeToggle: darkModeToggle !== null,
        bodyBackgroundColor: bodyBg,
        rootBackgroundColor: rootBg,
        totalButtons: buttons.length,
        buttonsWithColor: buttons.filter(b => b.hasColor).length,
        buttons: buttons.slice(0, 5), // 처음 5개만
        totalCards: cards.length,
        cardsWithBackground: cards.filter(c => c.hasBackground).length,
        cards: cards.slice(0, 3), // 처음 3개만
        progressBars: progressBars,
        isDarkTheme: bodyBg.includes('0') || bodyBg.includes('rgb(0') || bodyBg === 'rgb(15, 20, 25)',
        isLightTheme: bodyBg.includes('255') || bodyBg === 'rgb(255, 255, 255)'
      };
    });
    
    console.log('🎨 테마 정보:', {
      테마토글존재: themeInfo.hasThemeToggle,
      다크모드토글존재: themeInfo.hasDarkModeToggle,
      현재테마: themeInfo.isDarkTheme ? '다크' : themeInfo.isLightTheme ? '라이트' : '불명',
      배경색: themeInfo.bodyBackgroundColor
    });
    
    console.log('🔘 버튼 색상 상태:', {
      총버튼수: themeInfo.totalButtons,
      색상있는버튼: themeInfo.buttonsWithColor,
      색상비율: `${themeInfo.buttonsWithColor}/${themeInfo.totalButtons}`,
      예시버튼들: themeInfo.buttons
    });
    
    console.log('📱 카드/컨테이너 색상:', {
      총카드수: themeInfo.totalCards,
      배경색있는카드: themeInfo.cardsWithBackground,
      예시카드들: themeInfo.cards
    });
    
    console.log('📊 진행바 색상:', themeInfo.progressBars);
    
    // 테마 토글 시도
    if (themeInfo.hasThemeToggle) {
      console.log('🔄 테마 토글 테스트...');
      await page.click('[aria-label*="테마"], [data-testid="theme-toggle"], button[class*="theme"]');
      await page.waitForTimeout(1000);
      
      const afterToggle = await page.evaluate(() => {
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        return {
          newBackgroundColor: bodyBg,
          isDark: bodyBg.includes('0') || bodyBg.includes('rgb(0'),
          isLight: bodyBg.includes('255') || bodyBg === 'rgb(255, 255, 255)'
        };
      });
      
      console.log('🔄 토글 후 상태:', afterToggle);
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'theme-debug.png', fullPage: true });
    console.log('📸 테마 상태 스크린샷 저장');
    
  } catch (error) {
    console.error('❌ 테마 분석 오류:', error);
  } finally {
    await browser.close();
  }
})();