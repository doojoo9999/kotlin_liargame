const { chromium } = require('playwright');
const { BASE_URL } = require('./env-base');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // 콘솔 메시지 모니터링
  page.on('console', msg => {
    const text = msg.text();
    console.log(`[${msg.type().toUpperCase()}] ${text}`);
  });
  
  // 네트워크 요청 모니터링
  page.on('request', request => {
    if (request.url().includes('localhost:5173')) {
      console.log(`📡 요청: ${request.method()} ${request.url()}`);
    }
  });
  
  // 페이지 네비게이션 모니터링
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log(`🔄 메인 프레임 네비게이션: ${frame.url()}`);
    }
  });
  
  // DOM 변화 모니터링
  page.on('response', response => {
    if (response.url().includes('localhost:5173') && response.status() === 200) {
      console.log(`✅ 응답: ${response.url()}`);
    }
  });
  
  try {
    console.log('🔍 새로고침 원인 분석 시작...');
    
    await page.goto(`${BASE_URL}/main/demo`, { waitUntil: 'networkidle' });
    console.log('📄 초기 페이지 로드 완료');
    
    // React DevTools가 있다면 사용하여 리렌더링 감지
    await page.evaluate(() => {
      // React 리렌더링 감지를 위한 커스텀 로직
      const originalCreateElement = React.createElement;
      let renderCount = 0;
      
      React.createElement = function(...args) {
        renderCount++;
        if (renderCount % 50 === 0) { // 50번마다 로그
          console.log(`React render count: ${renderCount}`);
        }
        return originalCreateElement.apply(this, args);
      };
      
      // 타이머와 interval 모니터링
      const originalSetInterval = window.setInterval;
      const originalSetTimeout = window.setTimeout;
      
      window.setInterval = function(fn, delay) {
        console.log(`⏰ setInterval 호출됨: ${delay}ms 간격`);
        return originalSetInterval.call(this, fn, delay);
      };
      
      window.setTimeout = function(fn, delay) {
        console.log(`⏱️ setTimeout 호출됨: ${delay}ms 지연`);
        return originalSetTimeout.call(this, fn, delay);
      };
    });
    
    // HMR (Hot Module Replacement) 확인
    const hmrConnected = await page.evaluate(() => {
      return typeof window.__vite_plugin_react_preamble_installed__ !== 'undefined' ||
             typeof window.__webpack_hmr !== 'undefined';
    });
    
    console.log(`🔥 HMR 상태: ${hmrConnected ? '활성화' : '비활성화'}`);
    
    // 10초간 모니터링
    console.log('⏱️ 10초간 모니터링 시작...');
    let refreshCount = 0;
    
    const startTime = Date.now();
    
    // DOM 변화 감지
    await page.evaluate(() => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            const addedElements = Array.from(mutation.addedNodes)
              .filter(node => node.nodeType === Node.ELEMENT_NODE);
            
            if (addedElements.some(el => el.tagName === 'SCRIPT' || el.tagName === 'STYLE')) {
              console.log('🔄 새로운 스크립트/스타일 요소가 추가됨 (HMR 의심)');
            }
          }
        });
      });
      
      observer.observe(document.head, { childList: true, subtree: true });
      observer.observe(document.body, { childList: true, subtree: true });
    });
    
    // 특정 요소들의 변화 감지
    await page.evaluate(() => {
      const timer = document.querySelector('[style*="monospace"]');
      if (timer) {
        const observer = new MutationObserver(() => {
          // console.log('⏰ 타이머 텍스트 변경됨');
        });
        observer.observe(timer, { childList: true, subtree: true, characterData: true });
      }
    });
    
    // Vite HMR WebSocket 연결 상태 확인
    const wsConnections = await page.evaluate(() => {
      const sockets = [];
      if (window.WebSocket) {
        const originalWS = window.WebSocket;
        window.WebSocket = function(url, protocols) {
          console.log(`🌐 WebSocket 연결: ${url}`);
          const ws = new originalWS(url, protocols);
          
          ws.addEventListener('message', (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'full-reload') {
                console.log('🔄 Vite HMR이 전체 새로고침을 요청함!');
              } else if (data.type === 'update') {
                console.log('🔄 Vite HMR 업데이트:', data.updates);
              }
            } catch (e) {
              // JSON이 아닌 메시지
            }
          });
          
          return ws;
        };
      }
      return sockets;
    });
    
    await page.waitForTimeout(10000);
    
    // 최종 분석
    const endTime = Date.now();
    console.log(`\n📊 분석 완료 (${endTime - startTime}ms)`);
    
    // 현재 활성화된 타이머 개수 확인
    const activeTimers = await page.evaluate(() => {
      return {
        intervals: Object.keys(window).filter(key => key.includes('interval')).length,
        timeouts: Object.keys(window).filter(key => key.includes('timeout')).length
      };
    });
    
    console.log('📈 활성 타이머:', activeTimers);
    
    // 마지막으로 스크린샷
    await page.screenshot({ path: 'debug-refresh-analysis.png', fullPage: true });
    console.log('📸 분석 완료 스크린샷 저장');
    
  } catch (error) {
    console.error('❌ 분석 오류:', error);
  } finally {
    await browser.close();
  }
})();