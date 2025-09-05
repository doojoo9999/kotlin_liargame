import * as React from "react"
import "./styles/globals.css"

const SimpleMainTest: React.FC = () => {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
      <div className="max-w-4xl mx-auto">
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
          라이어 게임 Main Version - 단순 테스트
        </h1>
        <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
            ✅ 기본 React 컴포넌트 로드 성공
          </h2>
          <p style={{ color: '#6b7280' }}>
            Main Version이 성공적으로 로드되었습니다.
          </p>
        </div>
        <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
            🔧 다음 단계: Tailwind CSS 활성화
          </h2>
          <p style={{ color: '#6b7280' }}>
            Tailwind CSS가 올바르게 설정되었는지 확인하고 shadcn/ui 컴포넌트를 추가할 예정입니다.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SimpleMainTest
