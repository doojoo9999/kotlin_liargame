import React, {Suspense, useEffect} from 'react';
import {useVersionStore} from '@/shared/stores/version.store';

// 버전별 앱 컴포넌트 lazy 로딩
const LightApp = React.lazy(() => import('@/versions/light/App'));
const MainApp = React.lazy(() => import('@/versions/main/App'));

// 로딩 컴포넌트
const VersionLoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600">버전을 로딩 중...</p>
    </div>
  </div>
);

// 버전 감지 및 전환 컴포넌트
export const VersionRouter: React.FC = () => {
  const { currentVersion, initialize, isVersionSupported } = useVersionStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 지원되지 않는 버전인 경우 Light로 폴백
  const activeVersion = isVersionSupported(currentVersion) ? currentVersion : 'light';

  return (
    <Suspense fallback={<VersionLoadingFallback />}>
      {activeVersion === 'main' ? <MainApp /> : <LightApp />}
    </Suspense>
  );
};

// 버전 전환 컨트롤 컴포넌트
export const VersionSwitcher: React.FC = () => {
  const {
    currentVersion,
    userPreference,
    deviceCapability,
    autoDetectionEnabled,
    setUserPreference,
    toggleAutoDetection,
    getVersionFeatures,
    isVersionSupported
  } = useVersionStore();

  const handleVersionChange = (version: 'auto' | 'light' | 'main') => {
    setUserPreference(version);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">버전 설정</h3>

      {/* 현재 상태 표시 */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <p className="text-sm text-gray-600 mb-1">현재 버전</p>
        <p className="font-medium">
          {currentVersion === 'main' ? 'Main Version (고급)' : 'Light Version (기본)'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          디바이스 성능: {deviceCapability === 'high' ? '높음' : deviceCapability === 'medium' ? '보통' : '낮음'}
        </p>
      </div>

      {/* 버전 선택 */}
      <div className="space-y-3 mb-4">
        <label className="flex items-center">
          <input
            type="radio"
            name="version"
            value="auto"
            checked={userPreference === 'auto'}
            onChange={() => handleVersionChange('auto')}
            className="mr-2"
          />
          <div>
            <span className="font-medium">자동 선택</span>
            <p className="text-xs text-gray-500">디바이스에 최적화된 버전 자동 선택</p>
          </div>
        </label>

        <label className="flex items-center">
          <input
            type="radio"
            name="version"
            value="light"
            checked={userPreference === 'light'}
            onChange={() => handleVersionChange('light')}
            className="mr-2"
          />
          <div>
            <span className="font-medium">Light Version</span>
            <p className="text-xs text-gray-500">모든 디바이스에서 빠른 실행</p>
          </div>
        </label>

        <label className="flex items-center">
          <input
            type="radio"
            name="version"
            value="main"
            checked={userPreference === 'main'}
            onChange={() => handleVersionChange('main')}
            disabled={!isVersionSupported('main')}
            className="mr-2"
          />
          <div>
            <span className={`font-medium ${!isVersionSupported('main') ? 'text-gray-400' : ''}`}>
              Main Version
            </span>
            <p className="text-xs text-gray-500">
              {isVersionSupported('main')
                ? '고급 애니메이션 및 UI'
                : '현재 브라우저에서 지원되지 않습니다'
              }
            </p>
          </div>
        </label>
      </div>

      {/* 자동 감지 토글 */}
      <div className="mb-4">
        <label className="flex items-center justify-between">
          <span className="text-sm font-medium">자동 성능 감지</span>
          <input
            type="checkbox"
            checked={autoDetectionEnabled}
            onChange={toggleAutoDetection}
            className="toggle"
          />
        </label>
        <p className="text-xs text-gray-500 mt-1">
          디바이스 성능 변화를 자동으로 감지하여 최적 버전 제안
        </p>
      </div>

      {/* 버전별 기능 비교 */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">버전별 기능</h4>

        <div className="grid grid-cols-1 gap-3">
          {(['light', 'main'] as const).map(version => (
            <div key={version} className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-sm">
                  {version === 'main' ? 'Main Version' : 'Light Version'}
                </h5>
                {currentVersion === version && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    현재
                  </span>
                )}
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                {getVersionFeatures(version).slice(0, 3).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VersionRouter;
