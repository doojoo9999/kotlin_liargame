import React, {Component, ErrorInfo, ReactNode} from 'react';
import {AlertTriangle, Home, RefreshCw, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  preventNavigation?: boolean;
  allowRetry?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showErrorDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ 
      error, 
      errorInfo 
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: reportError(error, errorInfo);
    }
  }

  handleRetry = () => {
    console.log('[ErrorBoundary] User initiated retry');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false
    });
  };

  handleDismiss = () => {
    // Instead of hard navigation, just hide error and try to continue
    console.log('[ErrorBoundary] User dismissed error - attempting to continue');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false
    });
  };

  toggleErrorDetails = () => {
    this.setState(prev => ({
      showErrorDetails: !prev.showErrorDetails
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { allowRetry = true, preventNavigation = false } = this.props;

      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2"
                onClick={this.handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="mt-4 text-lg font-medium text-gray-900">
                오류가 발생했습니다
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                {preventNavigation
                  ? '작업 중 오류가 발생했지만 계속 진행할 수 있습니다.'
                  : '페이지를 로드하는 중 예상치 못한 오류가 발생했습니다.'
                }
              </p>

              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.toggleErrorDetails}
                  className="w-full"
                >
                  {this.state.showErrorDetails ? '오류 정보 숨기기' : '오류 정보 보기'}
                </Button>
              )}

              {process.env.NODE_ENV === 'development' && this.state.showErrorDetails && this.state.error && (
                <div className="text-left text-xs bg-gray-100 p-3 rounded border max-h-48 overflow-auto">
                  <div className="space-y-2">
                    <div>
                      <strong>오류:</strong>
                      <pre className="mt-1 text-red-600 whitespace-pre-wrap">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>컴포넌트 스택:</strong>
                        <pre className="mt-1 text-gray-600 whitespace-pre-wrap text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4">
                {allowRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    다시 시도
                  </Button>
                )}
                <Button
                  onClick={this.handleDismiss}
                  className="w-full"
                  variant="outline"
                >
                  계속하기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for error reporting
export function useErrorHandler() {
  return React.useCallback((error: Error, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: reportError(error, { context });
    }
  }, []);
}