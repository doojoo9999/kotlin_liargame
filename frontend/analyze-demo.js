import {chromium} from 'playwright';
import env from '../env-base.js';

const { BASE_URL } = env;

async function analyzeDemoPage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 페이지 로드
    console.log('Navigating to demo page...');
    await page.goto(`${BASE_URL}/main/demo`);

    // 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('=== 페이지 분석 시작 ===');
    
    // 1. 페이지 기본 정보
    const title = await page.title();
    const url = await page.url();
    console.log(`페이지 제목: ${title}`);
    console.log(`현재 URL: ${url}`);
    
    // 2. 색상 및 접근성 분석
    console.log('\n=== 색상 및 접근성 분석 ===');
    const colorAnalysis = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const colors = new Set();
      const backgrounds = new Set();
      const textElements = [];
      
      elements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const color = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        
        if (color !== 'rgba(0, 0, 0, 0)' && color !== 'rgb(0, 0, 0)') {
          colors.add(color);
        }
        if (backgroundColor !== 'rgba(0, 0, 0, 0)') {
          backgrounds.add(backgroundColor);
        }
        
        // 텍스트 요소 분석
        if (el.textContent && el.textContent.trim() && el.children.length === 0) {
          textElements.push({
            text: el.textContent.trim(),
            color: color,
            backgroundColor: backgroundColor,
            fontSize: computedStyle.fontSize,
            fontWeight: computedStyle.fontWeight
          });
        }
      });
      
      return {
        colors: Array.from(colors),
        backgrounds: Array.from(backgrounds),
        textElements: textElements.slice(0, 20) // 처음 20개만
      };
    });
    
    console.log('사용된 텍스트 색상:', colorAnalysis.colors.slice(0, 10));
    console.log('사용된 배경 색상:', colorAnalysis.backgrounds.slice(0, 10));
    
    // 3. 동적 요소 분석
    console.log('\n=== 동적 요소 분석 ===');
    const dynamicElements = await page.evaluate(() => {
      // 애니메이션이 있는 요소들 찾기
      const animatedElements = Array.from(document.querySelectorAll('[class*="motion"], [class*="animate"], [class*="transition"]'));
      
      // 인터랙티브 요소들
      const interactiveElements = Array.from(document.querySelectorAll('button, [onClick], [onHover], [role="button"]'));
      
      // 타이머나 동적 콘텐츠
      const timerElements = Array.from(document.querySelectorAll('[class*="timer"], [class*="countdown"], [class*="time"]'));
      
      return {
        animatedCount: animatedElements.length,
        interactiveCount: interactiveElements.length,
        timerCount: timerElements.length,
        totalElements: document.querySelectorAll('*').length
      };
    });
    
    console.log(`애니메이션 요소: ${dynamicElements.animatedCount}개`);
    console.log(`인터랙티브 요소: ${dynamicElements.interactiveCount}개`);
    console.log(`타이머/시간 관련 요소: ${dynamicElements.timerCount}개`);
    console.log(`총 DOM 요소: ${dynamicElements.totalElements}개`);
    
    // 4. 네비게이션 섹션 분석
    console.log('\n=== 네비게이션 및 콘텐츠 섹션 분석 ===');
    const sections = await page.evaluate(() => {
      const navButtons = Array.from(document.querySelectorAll('nav button, [role="tab"], .nav button'));
      const contentSections = Array.from(document.querySelectorAll('[role="tabpanel"], .content-section, main > div'));
      
      return {
        navItems: navButtons.map(btn => ({
          text: btn.textContent?.trim() || '',
          className: btn.className || '',
          isActive: btn.classList.contains('active') || btn.getAttribute('aria-selected') === 'true'
        })),
        contentSections: contentSections.length
      };
    });
    
    console.log('네비게이션 항목들:');
    sections.navItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.text} ${item.isActive ? '(활성)' : ''}`);
    });
    console.log(`콘텐츠 섹션: ${sections.contentSections}개`);
    
    // 5. 게임 관련 요소 분석
    console.log('\n=== 게임 관련 요소 분석 ===');
    const gameElements = await page.evaluate(() => {
      // 플레이어 카드
      const playerCards = Array.from(document.querySelectorAll('[class*="player"], [class*="card"]')).filter(el => 
        el.textContent.includes('Player') || el.textContent.includes('player') || 
        el.querySelector('[class*="avatar"]') || el.querySelector('[class*="status"]')
      );
      
      // 채팅 메시지
      const chatMessages = Array.from(document.querySelectorAll('[class*="message"], [class*="chat"]'));
      
      // 투표 관련
      const voteElements = Array.from(document.querySelectorAll('[class*="vote"], [class*="ballot"]'));
      
      // 타이머
      const timerDisplays = Array.from(document.querySelectorAll('[class*="timer"], [class*="countdown"]'));
      
      return {
        playerCards: playerCards.length,
        chatMessages: chatMessages.length,
        voteElements: voteElements.length,
        timerDisplays: timerDisplays.length
      };
    });
    
    console.log(`플레이어 카드: ${gameElements.playerCards}개`);
    console.log(`채팅 메시지: ${gameElements.chatMessages}개`);
    console.log(`투표 관련 요소: ${gameElements.voteElements}개`);
    console.log(`타이머 표시: ${gameElements.timerDisplays}개`);
    
    // 6. 스크린샷 촬영
    console.log('\n=== 스크린샷 촬영 ===');
    await page.screenshot({ 
      path: 'frontend/demo-analysis-full.png', 
      fullPage: true 
    });
    console.log('전체 페이지 스크린샷: demo-analysis-full.png');
    
    // 각 섹션별 스크린샷
    const navItems = ['overview', 'components', 'players', 'chat', 'voting', 'game-logic'];
    for (const section of navItems) {
      try {
        const navButton = await page.locator(`text="${section}"`).first();
        if (await navButton.isVisible()) {
          await navButton.click();
          await page.waitForTimeout(500);
          await page.screenshot({ 
            path: `frontend/demo-${section}.png`,
            clip: { x: 0, y: 0, width: 1200, height: 800 }
          });
          console.log(`${section} 섹션 스크린샷: demo-${section}.png`);
        }
      } catch (error) {
        console.log(`${section} 섹션 스크린샷 실패: ${error.message}`);
      }
    }
    
    // 7. 성능 메트릭
    console.log('\n=== 성능 분석 ===');
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    console.log(`페이지 로드 시간: ${performanceMetrics.loadTime}ms`);
    console.log(`DOM 콘텐츠 로드: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`First Paint: ${Math.round(performanceMetrics.firstPaint)}ms`);
    console.log(`First Contentful Paint: ${Math.round(performanceMetrics.firstContentfulPaint)}ms`);
    
    console.log('\n=== 분석 완료 ===');
    
  } catch (error) {
    console.error('분석 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

analyzeDemoPage();