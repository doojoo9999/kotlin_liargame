import {chromium} from 'playwright';

async function debugLibraries() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('라이브러리 및 에러 디버깅 시작...');
    
    // 콘솔 메시지 모니터링
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });
    
    // 페이지 에러 모니터링
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.toString());
    });
    
    // 네트워크 에러 모니터링
    const networkErrors = [];
    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push({
          status: response.status(),
          url: response.url(),
          statusText: response.statusText()
        });
      }
    });
    
    // 페이지 로드
    await page.goto('http://localhost:5173/main/demo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('\n=== 콘솔 메시지 ===');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
      if (msg.location) {
        console.log(`   위치: ${msg.location.url}:${msg.location.lineNumber}`);
      }
    });
    
    console.log('\n=== 페이지 에러 ===');
    pageErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    
    console.log('\n=== 네트워크 에러 ===');
    networkErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.status} ${error.statusText} - ${error.url}`);
    });
    
    // Framer Motion 및 React 상태 확인
    console.log('\n=== 라이브러리 상태 확인 ===');
    const libraryStatus = await page.evaluate(() => {
      try {
        return {
          react: typeof React !== 'undefined',
          reactVersion: typeof React !== 'undefined' ? React.version : 'not found',
          framerMotion: typeof window.motion !== 'undefined' || 
                       document.querySelector('[data-framer-component]') !== null ||
                       document.querySelector('.motion') !== null,
          framerElements: document.querySelectorAll('[class*="motion"]').length,
          lucideIcons: document.querySelectorAll('svg').length,
          tailwindClasses: document.querySelectorAll('[class*="bg-"], [class*="text-"]').length,
          totalElements: document.querySelectorAll('*').length,
          hasMotionComponents: typeof window.FramerMotion !== 'undefined' || 
                              document.querySelector('[data-projection-id]') !== null,
          errorElements: Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && el.textContent.includes('Error') || el.textContent.includes('error')
          ).length
        };
      } catch (error) {
        return { error: error.toString() };
      }
    });
    
    console.log('React 상태:', libraryStatus.react, '버전:', libraryStatus.reactVersion);
    console.log('Framer Motion 상태:', libraryStatus.framerMotion);
    console.log('Motion 요소 수:', libraryStatus.framerElements);
    console.log('SVG 아이콘 수:', libraryStatus.lucideIcons);
    console.log('Tailwind 클래스 수:', libraryStatus.tailwindClasses);
    console.log('Motion 컴포넌트 감지:', libraryStatus.hasMotionComponents);
    console.log('에러 요소 수:', libraryStatus.errorElements);
    console.log('총 DOM 요소:', libraryStatus.totalElements);
    
    // 실제 렌더링된 컴포넌트 확인
    console.log('\n=== 컴포넌트 렌더링 확인 ===');
    const componentCheck = await page.evaluate(() => {
      const playerCards = document.querySelectorAll('[class*="player"], [data-testid*="player"]');
      const buttons = document.querySelectorAll('button');
      const visibleButtons = Array.from(buttons).filter(btn => {
        const rect = btn.getBoundingClientRect();
        const style = window.getComputedStyle(btn);
        return rect.width > 0 && rect.height > 0 && 
               style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0';
      });
      
      return {
        playerCards: playerCards.length,
        totalButtons: buttons.length,
        visibleButtons: visibleButtons.length,
        buttonTexts: visibleButtons.slice(0, 5).map(btn => btn.textContent?.trim() || ''),
        hasContent: document.body.textContent.trim().length > 0,
        bodyStyle: {
          backgroundColor: window.getComputedStyle(document.body).backgroundColor,
          color: window.getComputedStyle(document.body).color
        }
      };
    });
    
    console.log('플레이어 카드:', componentCheck.playerCards);
    console.log('총 버튼:', componentCheck.totalButtons);
    console.log('보이는 버튼:', componentCheck.visibleButtons);
    console.log('버튼 텍스트:', componentCheck.buttonTexts);
    console.log('페이지에 콘텐츠 있음:', componentCheck.hasContent);
    console.log('Body 스타일:', componentCheck.bodyStyle);
    
    // 스크린샷
    await page.screenshot({ 
      path: 'frontend/debug-screenshot.png', 
      fullPage: true 
    });
    console.log('\n디버그 스크린샷 저장됨: debug-screenshot.png');
    
  } catch (error) {
    console.error('디버깅 중 오류:', error);
  } finally {
    await browser.close();
  }
}

debugLibraries();