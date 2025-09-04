import {chromium} from 'playwright';

async function verifyFixes() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 핵심 수정사항 검증 시작...\n');
    
    await page.goto('http://localhost:5173/main/demo', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // React 로딩 상태 확인
    const reactLoaded = await page.evaluate(() => {
      return document.querySelector('.game-demo-container') !== null;
    });
    
    // 플레이어 카드 렌더링 확인
    const playerCards = await page.locator('.player-card').count();
    
    // 게임 카드 확인
    const gameCards = await page.locator('.game-card').count();
    
    // 배경 색상 확인
    const hasGameBackground = await page.evaluate(() => {
      const container = document.querySelector('.game-demo-container');
      return container ? window.getComputedStyle(container).background.includes('gradient') : false;
    });
    
    // 텍스트 가독성 확인 
    const textColor = await page.evaluate(() => {
      const container = document.querySelector('.game-demo-container');
      return container ? window.getComputedStyle(container).color : 'none';
    });
    
    console.log('✅ React/컴포넌트 로딩:', reactLoaded ? '성공' : '실패');
    console.log('👥 플레이어 카드:', playerCards + '개');
    console.log('🃏 게임 카드:', gameCards + '개'); 
    console.log('🌈 그라디언트 배경:', hasGameBackground ? '적용됨' : '미적용');
    console.log('📝 텍스트 색상:', textColor);
    console.log('');
    
    if (reactLoaded && gameCards > 0 && hasGameBackground && textColor.includes('rgb(255, 255, 255)')) {
      console.log('🎉 모든 주요 문제가 해결되었습니다!');
      console.log('   ✅ React 정상 로딩');
      console.log('   ✅ 게임 카드 렌더링 성공');
      console.log('   ✅ 그라디언트 배경 적용');
      console.log('   ✅ 흰색 텍스트로 가독성 확보');
      console.log('   ✅ "검은 바탕에 검은 글씨" 문제 완전 해결');
    } else {
      console.log('❌ 일부 문제가 남아있습니다.');
    }
    
  } catch (error) {
    console.error('❌ 분석 중 오류:', error.message);
  } finally {
    await browser.close();
  }
}

verifyFixes();