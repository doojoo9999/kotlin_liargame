import {Container, Title} from '@mantine/core';
// Note: LoginForm will be created in the next steps and imported via a barrel file.
import {LoginForm} from '../features/auth';

export function LoginPage() {
  return (
    <Container size="xs" pt="xl">
      <Title order={2} ta="center" mb="lg">
        로그인
      </Title>
      <LoginForm />
    </Container>
  );
}
