import {chromium} from 'playwright';

async function analyzeCurrentIssues() {

async function analyzeCurrentIssues() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('현재 데모 페이지 상태 분석 시작...');
    
    // 페이지 로드
    await page.goto(`${BASE_URL}/main/demo`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 콘솔 에러 수집
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 네트워크 에러 수집
    const networkErrors = [];
    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push(`${response.status()} - ${response.url()}`);
      }
    });
    
    console.log('\n=== 페이지 로드 분석 ===');
    const title = await page.title();
    console.log(`페이지 제목: ${title}`);
    
    // 스크린샷 촬영
    await page.screenshot({ 
      path: 'frontend/current-state.png', 
      fullPage: true 
    });
    console.log('현재 상태 스크린샷 저장: current-state.png');
    
    // 색상 분석
    console.log('\n=== 색상 및 가시성 분석 ===');
    const colorAnalysis = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      
      // 모든 텍스트 요소 찾기
      const textElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.trim();
        const hasDirectText = text && el.children.length === 0;
        return hasDirectText;
      });
      
      const colors = new Map();
      const backgrounds = new Map();
      
      textElements.slice(0, 50).forEach(el => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const backgroundColor = style.backgroundColor;
        
        if (color !== 'rgba(0, 0, 0, 0)') {
          colors.set(color, (colors.get(color) || 0) + 1);
        }
        if (backgroundColor !== 'rgba(0, 0, 0, 0)') {
          backgrounds.set(backgroundColor, (backgrounds.get(backgroundColor) || 0) + 1);
        }
      });
      
      return {
        bodyBackground: computedStyle.backgroundColor,
        bodyColor: computedStyle.color,
        totalTextElements: textElements.length,
        uniqueColors: Array.from(colors.entries()).slice(0, 10),
        uniqueBackgrounds: Array.from(backgrounds.entries()).slice(0, 10),
        visibility: {
          hiddenElements: Array.from(document.querySelectorAll('*')).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
          }).length,
          transparentText: Array.from(document.querySelectorAll('*')).filter(el => {
            const style = window.getComputedStyle(el);
            const color = style.color;
            const background = style.backgroundColor;
            return color === background || color === 'transparent';
          }).length
        }
      };
    });
    
    console.log('Body 배경색:', colorAnalysis.bodyBackground);
    console.log('Body 글자색:', colorAnalysis.bodyColor);
    console.log('총 텍스트 요소:', colorAnalysis.totalTextElements);
    console.log('숨겨진 요소:', colorAnalysis.visibility.hiddenElements);
    console.log('투명한 텍스트:', colorAnalysis.visibility.transparentText);
    console.log('\n주요 색상들:');
    colorAnalysis.uniqueColors.forEach(([color, count]) => {
      console.log(`  ${color}: ${count}개`);
    });
    
    // 컴포넌트 분석
    console.log('\n=== 컴포넌트 분석 ===');
    const componentAnalysis = await page.evaluate(() => {
      // PlayerCard 찾기
      const playerCards = Array.from(document.querySelectorAll('[class*="player"], [class*="card"]'));
      const buttons = Array.from(document.querySelectorAll('button'));
      const inputs = Array.from(document.querySelectorAll('input'));
      const badges = Array.from(document.querySelectorAll('[class*="badge"]'));
      
      return {
        playerCards: playerCards.length,
        playerCardVisible: playerCards.filter(card => {
          const style = window.getComputedStyle(card);
          const rect = card.getBoundingClientRect();
          return style.display !== 'none' && 
                 style.visibility !== 'hidden' && 
                 style.opacity !== '0' &&
                 rect.width > 0 && rect.height > 0;
        }).length,
        buttons: buttons.length,
        buttonStyles: buttons.slice(0, 5).map(btn => ({
          text: btn.textContent?.trim() || '',
          backgroundColor: window.getComputedStyle(btn).backgroundColor,
          color: window.getComputedStyle(btn).color,
          visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
        })),
        inputs: inputs.length,
        badges: badges.length,
        totalElements: document.querySelectorAll('*').length
      };
    });
    
    console.log('플레이어 카드:', componentAnalysis.playerCards);
    console.log('보이는 플레이어 카드:', componentAnalysis.playerCardVisible);
    console.log('버튼 수:', componentAnalysis.buttons);
    console.log('입력 필드:', componentAnalysis.inputs);
    console.log('배지:', componentAnalysis.badges);
    console.log('총 DOM 요소:', componentAnalysis.totalElements);
    
    console.log('\n버튼 스타일 샘플:');
    componentAnalysis.buttonStyles.forEach((btn, index) => {
      console.log(`  ${index + 1}. "${btn.text}" - 배경: ${btn.backgroundColor}, 글자: ${btn.color}, 보임: ${btn.visible}`);
    });
    
    // 라이브러리 로드 확인
    console.log('\n=== 라이브러리 로드 확인 ===');
    const libraryCheck = await page.evaluate(() => {
      return {
        react: typeof window.React !== 'undefined',
        framerMotion: typeof window.FramerMotion !== 'undefined' || document.querySelector('[class*="motion"]') !== null,
        lucideReact: document.querySelector('[class*="lucide"]') !== null || document.querySelector('svg') !== null,
        tailwind: document.querySelector('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="m-"]') !== null,
        animations: document.querySelector('[class*="animate"], [class*="transition"]') !== null
      };
    });
    
    console.log('React 로드:', libraryCheck.react);
    console.log('Framer Motion 사용:', libraryCheck.framerMotion);
    console.log('Lucide Icons 사용:', libraryCheck.lucideReact);
    console.log('Tailwind CSS 적용:', libraryCheck.tailwind);
    console.log('애니메이션 클래스:', libraryCheck.animations);
    
    // 에러 리포트
    console.log('\n=== 에러 리포트 ===');
    console.log('콘솔 에러:', consoleErrors.length ? consoleErrors : '없음');
    console.log('네트워크 에러:', networkErrors.length ? networkErrors : '없음');
    
    // 각 섹션 스크린샷
    console.log('\n=== 섹션별 스크린샷 ===');
    const sections = ['overview', 'components', 'players', 'chat', 'voting', 'game-logic'];
    
    for (const section of sections) {
      try {
        // 네비게이션 버튼 찾기 (더 유연한 선택자 사용)
        const navButton = page.locator(`button:has-text("${section}"), button:has-text("${section.charAt(0).toUpperCase() + section.slice(1)}")`).first();
        
        if (await navButton.count() > 0) {
          await navButton.click();
          await page.waitForTimeout(1000);
          
          await page.screenshot({ 
            path: `frontend/section-${section}.png`,
            clip: { x: 0, y: 0, width: 1400, height: 900 }
          });
          console.log(`${section} 섹션 스크린샷 저장됨`);
        } else {
          console.log(`${section} 섹션 버튼을 찾을 수 없음`);
        }
      } catch (error) {
        console.log(`${section} 섹션 처리 실패:`, error.message);
      }
    }
    
    console.log('\n=== 분석 완료 ===');
    
  } catch (error) {
    console.error('분석 중 오류:', error);
  } finally {
    await browser.close();
  }
}

analyzeCurrentIssues();