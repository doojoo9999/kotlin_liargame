const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 CSS 변수 주입 상태 확인 중...');
    
    await page.goto('http://localhost:5173/main/demo', { waitUntil: 'networkidle' });
    
    // CSS 변수 확인
    const cssVariables = await page.evaluate(() => {
      const style = window.getComputedStyle(document.documentElement);
      const body = document.body;
      const bodyStyle = window.getComputedStyle(body);
      
      // style 태그 확인
      const styleTags = Array.from(document.querySelectorAll('style')).map(tag => ({
        content: tag.textContent?.substring(0, 200) + '...',
        hasThemeVars: tag.textContent?.includes('--color-background') || false
      }));
      
      // 실제 적용된 CSS 변수들
      const variables = {};
      const variableNames = [
        '--color-background',
        '--color-card-bg', 
        '--color-text-primary',
        '--color-accent-primary',
        '--color-accent-danger'
      ];
      
      variableNames.forEach(varName => {
        variables[varName] = style.getPropertyValue(varName).trim() || 'NOT_SET';
      });
      
      // game-card 클래스 요소의 실제 스타일
      const gameCard = document.querySelector('.game-card');
      const gameCardStyles = gameCard ? {
        backgroundColor: window.getComputedStyle(gameCard).backgroundColor,
        color: window.getComputedStyle(gameCard).color,
        border: window.getComputedStyle(gameCard).border
      } : null;
      
      return {
        styleTags,
        cssVariables: variables,
        gameCardElement: gameCard ? 'EXISTS' : 'NOT_FOUND',
        gameCardStyles,
        bodyBackground: bodyStyle.backgroundColor,
        documentElementBackground: style.backgroundColor
      };
    });
    
    console.log('📊 CSS 변수 상태:', cssVariables.cssVariables);
    console.log('📝 스타일 태그:', cssVariables.styleTags.length + '개');
    cssVariables.styleTags.forEach((tag, i) => {
      console.log(`   ${i + 1}. 테마 변수 포함: ${tag.hasThemeVars ? '✅' : '❌'}`);
      if (tag.hasThemeVars) {
        console.log(`      내용: ${tag.content}`);
      }
    });
    
    console.log('🎨 게임카드 스타일:', cssVariables.gameCardStyles);
    console.log('🎯 배경색 상태:');
    console.log(`   - Body: ${cssVariables.bodyBackground}`);
    console.log(`   - DocumentElement: ${cssVariables.documentElementBackground}`);
    
    if (cssVariables.cssVariables['--color-background'] === 'NOT_SET') {
      console.log('❌ CSS 변수가 설정되지 않았습니다!');
    } else {
      console.log('✅ CSS 변수가 설정되었습니다.');
    }
    
  } catch (error) {
    console.error('❌ CSS 변수 확인 오류:', error);
  } finally {
    await browser.close();
  }
})();