import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Container, Center, Stack } from '@mantine/core';
import { AlertCircle } from 'lucide-react';

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
        <Container>
          <Center h="100vh">
            <Stack align="center">
              <Alert icon={<AlertCircle size="1rem" />} title="문제가 발생했습니다!" color="red">
                애플리케이션에 예기치 않은 오류가 발생하여 중단되었습니다.
                <br />
                이 문제가 계속되면 관리자에게 문의하세요.
              </Alert>
              {this.state.error && (
                <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
                  {this.state.error.toString()}
                </pre>
              )}
              <Button onClick={this.handleReset} color="red" variant="light">
                새로고침
              </Button>
            </Stack>
          </Center>
        </Container>
      );
    }

    return this.props.children;
  }
}
