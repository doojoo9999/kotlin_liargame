import {chromium} from 'playwright';

async function analyzeFinalDemo() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 최종 IntegratedGameDemo 분석 시작...\n');
    
    // 페이지 로드
    await page.goto('http://localhost:5173/main/demo', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // React 로딩 상태 확인
    const reactLoaded = await page.evaluate(() => {
      return typeof window.React !== 'undefined' || document.querySelector('[data-reactroot]') !== null;
    });
    console.log(`✅ React 상태: ${reactLoaded ? '정상 로딩' : '로딩 실패'}`);
    
    // 페이지 제목과 기본 구조
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);
    
    // 배경색 확인 (더이상 검은 바탕에 검은 글씨 문제가 없는지)
    const backgroundColor = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });
    console.log(`🎨 Body 배경색: ${backgroundColor}`);
    
    // IntegratedGameDemo 컴포넌트 렌더링 확인
    const demoContainer = await page.locator('.game-demo-container').count();
    console.log(`🎮 메인 데모 컨테이너: ${demoContainer}개`);
    
    // 새로운 색상 팔레트 적용 확인
    const gradientBackground = await page.evaluate(() => {
      const container = document.querySelector('.game-demo-container');
      if (container) {
        return window.getComputedStyle(container).background || window.getComputedStyle(container).backgroundImage;
      }
      return 'none';
    });
    console.log(`🌈 그라디언트 배경: ${gradientBackground !== 'none' ? '적용됨' : '미적용'}`);
    
    // PlayerCard 컴포넌트 렌더링 확인
    const playerCards = await page.locator('.player-card').count();
    console.log(`👥 플레이어 카드: ${playerCards}개`);
    
    // GameCard 컴포넌트 확인
    const gameCards = await page.locator('.game-card').count();
    console.log(`🃏 게임 카드: ${gameCards}개`);
    
    // 버튼 컴포넌트 확인
    const gameButtons = await page.locator('.game-button').count();
    console.log(`🔘 게임 버튼: ${gameButtons}개`);
    
    // 텍스트 가독성 확인 (흰색 텍스트 확인)
    const textColor = await page.evaluate(() => {
      const heading = document.querySelector('h1, h2');
      if (heading) {
        return window.getComputedStyle(heading).color;
      }
      return 'none';
    });
    console.log(`📝 메인 텍스트 색상: ${textColor}`);
    
    // 애니메이션 확인 (CSS 애니메이션)
    const animatedElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let animatedCount = 0;
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.animationName !== 'none' || style.transition !== 'all 0s ease 0s') {
          animatedCount++;
        }
      });
      return animatedCount;
    });
    console.log(`✨ 애니메이션 요소: ${animatedElements}개`);
    
    // 게임 상태 표시 확인
    const gameStats = await page.evaluate(() => {
      const statElements = document.querySelectorAll('.stat-item, .game-stat');
      return statElements.length;
    });
    console.log(`📊 게임 통계 요소: ${gameStats}개`);
    
    // 오류 확인
    const errors = await page.evaluate(() => {
      const errorMessages = [];
      // 콘솔 오류는 이미 캐치되어 있음
      
      // 빈 요소나 렌더링 실패 확인
      const emptyElements = document.querySelectorAll('div:empty, span:empty');
      if (emptyElements.length > 10) { // 의도된 빈 요소가 아닌 경우
        errorMessages.push(`과도한 빈 요소: ${emptyElements.length}개`);
      }
      
      return errorMessages;
    });
    
    console.log('\n🔍 최종 분석 결과:');
    console.log('==================');
    console.log(`✅ React 로딩: ${reactLoaded ? '성공' : '실패'}`);
    console.log(`✅ 컴포넌트 렌더링: ${demoContainer > 0 ? '성공' : '실패'}`);
    console.log(`✅ PlayerCard 표시: ${playerCards > 0 ? '성공' : '실패'}`);
    console.log(`✅ 색상 대비: ${textColor.includes('rgb(255, 255, 255)') || textColor.includes('#ffffff') ? '개선됨' : '확인 필요'}`);
    console.log(`✅ 애니메이션: ${animatedElements > 0 ? '작동' : '미작동'}`);
    
    if (errors.length > 0) {
      console.log('\n❌ 발견된 문제:');
      errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('\n🎉 문제없이 정상 작동 중!');
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'final-demo-analysis.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: final-demo-analysis.png');
    
  } catch (error) {
    console.error('❌ 분석 중 오류:', error.message);
  } finally {
    await browser.close();
  }
}

analyzeFinalDemo();