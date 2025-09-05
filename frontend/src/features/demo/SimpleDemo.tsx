import React from 'react';

const SimpleDemo: React.FC = () => {
  return (
    <div style={{
      padding: '20px',
      background: 'linear-gradient(135deg, #0d0e10 0%, #1a1b1f 100%)',
      color: 'white',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>🎉 통합 게임 데모 성공!</h1>
        <p style={{ fontSize: '18px', marginBottom: '24px', color: '#a6a7ab' }}>
          /main/demo 경로가 정상적으로 작동하고 있습니다!
        </p>

        <div style={{
          background: 'rgba(0, 210, 106, 0.1)',
          border: '1px solid rgba(0, 210, 106, 0.3)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          color: '#00d26a'
        }}>
          ✅ 라우터 문제가 해결되었습니다!
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>통합 작업 완료 현황</h2>
          <p style={{ color: '#a6a7ab', marginBottom: '16px' }}>
            frontend-demo-integration.md 계획서에 따른 작업 결과
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontWeight: '500', marginBottom: '8px' }}>✅ Phase 1: 베이스 구축</div>
              <div style={{ fontSize: '14px', color: '#a6a7ab' }}>LinearStyleDemo를 베이스로 통합 데모 생성 완료</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontWeight: '500', marginBottom: '8px' }}>✅ Phase 2-3: 컴포넌트 통합</div>
              <div style={{ fontSize: '14px', color: '#a6a7ab' }}>6개 섹션으로 모든 기능 통합 완료</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontWeight: '500', marginBottom: '8px' }}>✅ Phase 4: 파일 정리</div>
              <div style={{ fontSize: '14px', color: '#a6a7ab' }}>9개 중복 파일 → 1개 통합 파일로 정리</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontWeight: '500', marginBottom: '8px' }}>✅ Phase 5: 라우터 설정</div>
              <div style={{ fontSize: '14px', color: '#a6a7ab' }}>/main/demo 경로에서 접근 가능</div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>접근 가능한 경로</h2>
          <ul style={{ color: '#a6a7ab', lineHeight: '1.6' }}>
            <li><code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>http://localhost:5173/main/demo</code> - React 통합 데모</li>
            <li><code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>http://localhost:5173/integrated-demo.html</code> - HTML 데모</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SimpleDemo;
