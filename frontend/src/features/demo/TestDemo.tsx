import React from 'react';

const TestDemo: React.FC = () => {
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1>테스트 데모 페이지</h1>
      <p>이 페이지가 보인다면 라우팅이 정상 작동하고 있습니다.</p>
      <div style={{ marginTop: '20px' }}>
        <h2>통합 데모 테스트</h2>
        <p>곧 IntegratedGameDemo로 교체될 예정입니다.</p>
      </div>
    </div>
  );
};

export default TestDemo;
