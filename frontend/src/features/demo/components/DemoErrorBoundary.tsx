import React, {Component, ErrorInfo, ReactNode} from 'react';
import {AlertCircle, RefreshCw} from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class DemoErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Demo component error:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="game-card"
          style={{
            padding: '32px',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '20px auto',
            background: 'var(--color-card-bg)',
            border: '2px solid var(--color-accent-danger)',
            borderRadius: 'var(--border-radius-lg)'
          }}
          role="alert"
          aria-live="assertive"
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: 'var(--color-accent-danger)'
          }}>
            <AlertCircle size={32} />
          </div>

          <h3 style={{
            color: 'var(--color-accent-danger)',
            marginBottom: '16px',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            게임 데모 오류 발생
          </h3>

          <p style={{
            color: 'var(--color-text-secondary)',
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            게임 데모를 로드하는 중 예상치 못한 오류가 발생했습니다.
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <>
                <br /><br />
                <strong>오류 메시지:</strong> {this.state.error.message}
              </>
            )}
          </p>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              className="game-button"
              onClick={this.handleRetry}
              style={{
                backgroundColor: 'var(--color-accent-primary)',
                color: 'var(--color-text-primary)',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              aria-label="데모 다시 시도"
            >
              <RefreshCw size={16} />
              다시 시도
            </button>

            <button
              className="game-button"
              onClick={this.handleReload}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                border: '2px solid var(--color-card-border)',
                padding: '12px 20px'
              }}
              aria-label="페이지 새로고침"
            >
              페이지 새로고침
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details style={{
              marginTop: '20px',
              textAlign: 'left',
              background: 'var(--color-card-hover)',
              padding: '16px',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '12px'
            }}>
              <summary style={{
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                marginBottom: '8px'
              }}>
                개발자 정보 (클릭하여 펼치기)
              </summary>
              <pre style={{
                whiteSpace: 'pre-wrap',
                color: 'var(--color-text-muted)',
                fontSize: '11px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {this.state.error?.stack}
                {'\n\n'}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };
}

// Helper hook for programmatic error reporting
export const useErrorHandler = () => {
  return React.useCallback((error: Error, errorInfo?: any) => {
    console.error('Game demo error:', error, errorInfo);
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: errorReportingService.report(error, errorInfo);
    }
  }, []);
};