const { chromium } = require('playwright');

async function takeFinalScreenshot() {
  const browser = await chromium.launch({ headless: false }); // 브라우저 창을 보여줌
  const page = await browser.newPage();
  
  try {
    console.log('🚀 로그인 페이지로 이동 중...');
    
    // 페이지로 이동
    await page.goto('http://localhost:5173/main/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForSelector('form', { timeout: 10000 });
    await page.waitForTimeout(3000);
    
    // 데스크탑 해상도로 설정
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('📸 일반 사용자 로그인 화면 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'docs/upgrade_1/final-login-normal.png',
      fullPage: true 
    });
    
    // admin 입력해서 비밀번호 필드 나오는 것 확인
    console.log('🔐 admin 계정으로 비밀번호 필드 테스트...');
    await page.fill('input[type="text"]', 'admin');
    await page.waitForTimeout(1000); // 애니메이션 대기
    
    console.log('📸 admin 계정 로그인 화면 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'docs/upgrade_1/final-login-admin.png',
      fullPage: true 
    });
    
    // 일반 사용자 화면으로 다시 변경
    console.log('👤 일반 사용자 화면으로 복원...');
    await page.fill('input[type="text"]', '테스트유저');
    await page.waitForTimeout(1000);
    
    console.log('📸 최종 로그인 화면 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'docs/upgrade_1/final-login-user.png',
      fullPage: true 
    });
    
    console.log('✅ 모든 스크린샷 촬영 완료!');
    console.log('📁 생성된 파일들:');
    console.log('  - final-login-normal.png (기본 화면)');
    console.log('  - final-login-admin.png (admin 비밀번호 필드 표시)');  
    console.log('  - final-login-user.png (일반 사용자 입력)');
    
  } catch (error) {
    console.error('❌ 스크린샷 촬영 실패:', error.message);
  } finally {
    await browser.close();
  }
}

takeFinalScreenshot();