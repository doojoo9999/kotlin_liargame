import React, {useEffect, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {VersionSwitcher} from '@/app/VersionRouter';
import {useVersionStore} from '@/shared/stores/version.store';
import {useAuthStore} from '@/shared/stores/auth.store';
import {useGameStore} from '@/shared/stores/game.store';
import {useWebSocketStore} from '@/shared/stores/websocket.store';

// Phase 2에서 만든 컴포넌트들
import {GameComponentsDemo} from '@/features/demo/GameComponentsDemo';

export const IntegratedVersionDemo: React.FC = () => {
  const [showVersionSwitcher, setShowVersionSwitcher] = useState(false);
  const [demoMode, setDemoMode] = useState<'comparison' | 'integration' | 'performance'>('integration');

  const {
    currentVersion,
    deviceCapability,
    isVersionSupported,
    detectOptimalVersion
  } = useVersionStore();

  const { isAuthenticated, user } = useAuthStore();
  const { currentGame, players } = useGameStore();
  const { isConnected, error } = useWebSocketStore();

  // 시스템 상태 정보 수집
  const [systemInfo, setSystemInfo] = useState({
    memoryUsage: 0,
    renderTime: 0,
    bundleSize: 0,
  });

  useEffect(() => {
    // 성능 메트릭 수집
    const collectMetrics = () => {
      // 메모리 사용량 (가능한 경우)
      if ('memory' in performance) {
        setSystemInfo(prev => ({
          ...prev,
          memoryUsage: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
        }));
      }

      // 렌더링 시간 측정
      const renderStart = performance.now();
      requestAnimationFrame(() => {
        const renderEnd = performance.now();
        setSystemInfo(prev => ({
          ...prev,
          renderTime: Math.round((renderEnd - renderStart) * 100) / 100
        }));
      });
    };

    const interval = setInterval(collectMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                라이어 게임 통합 데모
              </h1>
              <p className="text-gray-600">
                Light Version ↔ Main Version 완전 통합 시스템
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* 현재 버전 표시 */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  currentVersion === 'main' ? 'bg-blue-500' : 'bg-green-500'
                }`} />
                <span className="font-medium">
                  {currentVersion === 'main' ? 'Main Version' : 'Light Version'}
                </span>
              </div>

              {/* 버전 전환 버튼 */}
              <button
                onClick={() => setShowVersionSwitcher(!showVersionSwitcher)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                버전 전환
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 데모 모드 선택 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">데모 모드 선택</h2>
          <div className="flex space-x-4">
            {[
              { key: 'integration', label: '통합 시스템', desc: '버전 전환 및 공통 모듈 테스트' },
              { key: 'comparison', label: '버전 비교', desc: 'Light vs Main 기능 비교' },
              { key: 'performance', label: '성능 분석', desc: '실시간 성능 모니터링' }
            ].map(mode => (
              <button
                key={mode.key}
                onClick={() => setDemoMode(mode.key as any)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  demoMode === mode.key 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{mode.label}</div>
                <div className="text-sm text-gray-600">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 콘텐츠 영역 */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {demoMode === 'integration' && (
                <motion.div
                  key="integration"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <GameComponentsDemo />
                </motion.div>
              )}

              {demoMode === 'comparison' && (
                <motion.div
                  key="comparison"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">버전별 기능 비교</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Light Version */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-green-700">Light Version</h4>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          호환성 우수
                        </span>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Mantine UI 컴포넌트
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          모든 브라우저 지원
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          빠른 로딩 속도
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          저사양 디바이스 최적화
                        </li>
                      </ul>
                    </div>

                    {/* Main Version */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-blue-700">Main Version</h4>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          고급 기능
                        </span>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          shadcn/ui + Framer Motion
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          고급 애니메이션 효과
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          파티클 시스템
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          동적 성능 최적화
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {demoMode === 'performance' && (
                <motion.div
                  key="performance"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">실시간 성능 모니터링</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded p-4">
                      <div className="text-2xl font-bold text-blue-600">{systemInfo.memoryUsage}MB</div>
                      <div className="text-sm text-gray-600">메모리 사용량</div>
                    </div>
                    <div className="bg-gray-50 rounded p-4">
                      <div className="text-2xl font-bold text-green-600">{systemInfo.renderTime}ms</div>
                      <div className="text-sm text-gray-600">렌더링 시간</div>
                    </div>
                    <div className="bg-gray-50 rounded p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {currentVersion === 'main' ? '~2.1MB' : '~1.2MB'}
                      </div>
                      <div className="text-sm text-gray-600">번들 크기</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>브라우저 호환성</span>
                        <span>{isVersionSupported('main') ? '100%' : '85%'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: isVersionSupported('main') ? '100%' : '85%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 버전 전환기 */}
            <AnimatePresence>
              {showVersionSwitcher && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <VersionSwitcher />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 시스템 상태 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">시스템 상태</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">현재 버전</span>
                  <span className="font-medium">
                    {currentVersion === 'main' ? 'Main' : 'Light'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">디바이스 성능</span>
                  <span className={`text-sm font-medium ${
                    deviceCapability === 'high' ? 'text-green-600' :
                    deviceCapability === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {deviceCapability === 'high' ? '높음' :
                     deviceCapability === 'medium' ? '보통' : '낮음'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">WebSocket 연결</span>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm">
                      {isConnected ? '연결됨' : '연결 안됨'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">인증 상태</span>
                  <span className="text-sm">
                    {isAuthenticated ? `${user?.nickname}` : '로그인 필요'}
                  </span>
                </div>
              </div>
            </div>

            {/* 공통 모듈 상태 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">공통 모듈 상태</h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  API 클라이언트 ✓
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Zustand 스토어 ✓
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  WebSocket 클라이언트 ✓
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  게임 로직 유틸리티 ✓
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  타입 정의 ✓
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
