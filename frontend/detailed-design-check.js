import {chromium} from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== 디자인 상세 점검 ===\n');
    
    await page.goto('http://localhost:5173/main/design', { waitUntil: 'networkidle' });
    
    // 페이지 로딩 대기
    await page.waitForTimeout(2000);
    
    // 전체 스크린샷
    await page.screenshot({ path: 'design-check-full.png', fullPage: true });
    console.log('📸 전체 스크린샷 저장: design-check-full.png');
    
    // CSS 적용 상태 정밀 분석
    console.log('\n=== CSS 적용 상태 분석 ===');
    
    // Body 배경색 확인
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        fontFamily: computed.fontFamily
      };
    });
    console.log('Body 스타일:', bodyStyles);
    
    // 메인 컨테이너 확인
    const mainContainer = await page.locator('.min-h-screen').first();
    if (await mainContainer.count() > 0) {
      const containerStyles = await mainContainer.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          minHeight: computed.minHeight
        };
      });
      console.log('메인 컨테이너 스타일:', containerStyles);
    }
    
    // 사이드바 확인
    const sidebar = await page.locator('.w-64').first();
    if (await sidebar.count() > 0) {
      const sidebarStyles = await sidebar.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          width: computed.width,
          backgroundColor: computed.backgroundColor,
          borderRight: computed.borderRight
        };
      });
      console.log('사이드바 스타일:', sidebarStyles);
    }
    
    // 버튼 스타일 확인
    console.log('\n=== 버튼 스타일 분석 ===');
    const buttons = await page.locator('button').all();
    
    for (let i = 0; i < Math.min(buttons.length, 3); i++) {
      const buttonStyles = await buttons[i].evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          padding: computed.padding,
          borderRadius: computed.borderRadius,
          border: computed.border,
          boxShadow: computed.boxShadow,
          className: el.className
        };
      });
      console.log(`Button ${i+1} 스타일:`, buttonStyles);
    }
    
    // Tailwind CSS 클래스 확인
    console.log('\n=== Tailwind CSS 클래스 확인 ===');
    const tailwindElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="rounded"]');
      return Array.from(elements).slice(0, 5).map(el => ({
        tagName: el.tagName,
        className: el.className,
        computedBg: window.getComputedStyle(el).backgroundColor,
        computedColor: window.getComputedStyle(el).color
      }));
    });
    
    tailwindElements.forEach((el, i) => {
      console.log(`Tailwind 요소 ${i+1}:`, el);
    });
    
    // 각 섹션별 실제 렌더링 확인
    console.log('\n=== 섹션별 렌더링 확인 ===');
    
    const sections = [
      { name: 'Overview', text: 'Overview' },
      { name: 'Players', text: 'Players' },
      { name: 'Components', text: 'Components' }
    ];
    
    for (const section of sections) {
      console.log(`\n--- ${section.name} 섹션 ---`);
      
      // 섹션 클릭
      const sectionBtn = page.locator(`nav button:has-text("${section.text}")`);
      if (await sectionBtn.count() > 0) {
        await sectionBtn.click();
        await page.waitForTimeout(1500);
        
        // 섹션별 스크린샷
        await page.screenshot({ 
          path: `design-check-${section.name.toLowerCase()}.png`,
          fullPage: true
        });
        
        // 컨텐츠 영역 확인
        const contentArea = await page.locator('.flex-1, main, [role="main"]').first();
        if (await contentArea.count() > 0) {
          const hasVisibleContent = await contentArea.evaluate(el => {
            const rect = el.getBoundingClientRect();
            const hasText = el.textContent && el.textContent.trim().length > 0;
            const hasChildren = el.children.length > 0;
            return { hasText, hasChildren, rect: { width: rect.width, height: rect.height } };
          });
          console.log(`${section.name} 컨텐츠 상태:`, hasVisibleContent);
        }
        
        // 특정 요소들 확인
        if (section.name === 'Players') {
          const playerCards = await page.locator('[class*="player"], .relative.p-4').count();
          console.log(`플레이어 카드 개수: ${playerCards}`);
        }
        
        if (section.name === 'Components') {
          const colorPalette = await page.locator('.w-16.h-16').count();
          console.log(`컬러 팔레트 개수: ${colorPalette}`);
        }
      }
    }
    
    // HTML 구조 확인
    console.log('\n=== HTML 구조 확인 ===');
    const htmlStructure = await page.evaluate(() => {
      const mainDiv = document.querySelector('.min-h-screen');
      if (!mainDiv) return 'Main div not found';
      
      const structure = {
        mainClasses: mainDiv.className,
        childrenCount: mainDiv.children.length,
        hasContent: mainDiv.textContent && mainDiv.textContent.trim().length > 0,
        innerHTML: mainDiv.innerHTML.substring(0, 200) + '...'
      };
      return structure;
    });
    console.log('HTML 구조:', htmlStructure);
    
    // 최종 진단
    console.log('\n=== 최종 진단 ===');
    
    const isDarkTheme = bodyStyles.backgroundColor.includes('rgb(') && 
                       !bodyStyles.backgroundColor.includes('255, 255, 255');
    const hasTailwindClasses = tailwindElements.length > 0;
    const hasProperStyling = buttons.length > 0 && 
                            tailwindElements.some(el => el.computedBg !== 'rgba(0, 0, 0, 0)');
    
    console.log('다크 테마 적용:', isDarkTheme ? '✅' : '❌');
    console.log('Tailwind 클래스 존재:', hasTailwindClasses ? '✅' : '❌');
    console.log('스타일링 적용됨:', hasProperStyling ? '✅' : '❌');
    
    if (!isDarkTheme || !hasProperStyling) {
      console.log('\n⚠️ 문제 감지: CSS가 제대로 적용되지 않았을 가능성');
      console.log('가능한 원인:');
      console.log('1. Tailwind CSS 빌드 문제');
      console.log('2. CSS 파일 로딩 실패');
      console.log('3. React 컴포넌트 렌더링 문제');
      console.log('4. 클래스명 오타 또는 설정 문제');
    } else {
      console.log('\n✅ 디자인이 정상적으로 적용된 것으로 보임');
    }
    
  } catch (error) {
    console.error('❌ 에러 발생:', error);
  } finally {
    console.log('\n⏳ 10초 대기 후 브라우저 종료...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();