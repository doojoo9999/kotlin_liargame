import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Alert, Box, Button, Center, Container, Paper, Stack, TextInput, Title} from '@mantine/core';
import {useForm} from '@mantine/form';
import {notifications} from '@mantine/notifications';
import {IconAlertCircle, IconUser} from '@tabler/icons-react';

interface LoginForm {
  nickname: string;
  password?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginForm>({
    initialValues: {
      nickname: '',
      password: '',
    },
    validate: {
      nickname: (value) =>
        value.length < 2 ? '닉네임은 2글자 이상이어야 합니다' : null,
    },
  });

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      // TODO: 실제 로그인 API 호출
      console.log('Login attempt:', values);

      // 임시로 성공으로 처리
      notifications.show({
        title: '로그인 성공',
        message: `${values.nickname}님, 환영합니다!`,
        color: 'green',
      });

      navigate('/lobby');
    } catch (err) {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" style={{ height: '100vh' }}>
      <Center style={{ height: '100%' }}>
        <Box w="100%" maw={400}>
          <Paper p="xl" radius="md" withBorder>
            <Stack gap="lg">
              <div>
                <Title order={2} ta="center" mb="md">
                  라이어 게임
                </Title>
                <Title order={4} ta="center" c="dimmed">
                  로그인
                </Title>
              </div>

              {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red">
                  {error}
                </Alert>
              )}

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                  <TextInput
                    label="닉네임"
                    placeholder="게임에서 사용할 닉네임을 입력하세요"
                    leftSection={<IconUser size={16} />}
                    required
                    {...form.getInputProps('nickname')}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    size="md"
                  >
                    게임 시작하기
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Paper>
        </Box>
      </Center>
    </Container>
  );
}
