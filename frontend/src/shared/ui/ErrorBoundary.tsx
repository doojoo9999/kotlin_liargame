import type {ErrorInfo, ReactNode} from 'react';
import {Component} from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // You could also log the error to an external service here
  }

  private handleReset = () => {
    // Attempt to reset by reloading the page
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '500px',
            padding: '2rem',
            border: '1px solid #dc2626',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '1rem',
              color: '#dc2626'
            }}>
              ⚠️ 문제가 발생했습니다!
            </div>
            <p style={{
              color: '#7f1d1d',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              애플리케이션에 예기치 않은 오류가 발생하여 중단되었습니다.
              <br />
              이 문제가 계속되면 관리자에게 문의하세요.
            </p>
            {this.state.error && (
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                background: '#f5f5f5', 
                padding: '1rem', 
                borderRadius: '4px',
                fontSize: '0.875rem',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: '200px',
                marginBottom: '1.5rem'
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <button 
              onClick={this.handleReset}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
