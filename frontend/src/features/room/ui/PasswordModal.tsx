import {Button, Modal, PasswordInput, Stack} from '@mantine/core';
import {useForm} from '@mantine/form';

interface PasswordModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  loading: boolean;
}

export function PasswordModal({ opened, onClose, onSubmit, loading }: PasswordModalProps) {
  const form = useForm({
    initialValues: {
      password: '',
    },
    validate: {
      password: (value: string) => (value.length > 0 ? null : '비밀번호를 입력해주세요.'),
    },
  });

  const handleSubmit = (values: { password: string }) => {
    onSubmit(values.password);
  };

  return (
    <Modal opened={opened} onClose={onClose} title="비밀번호 입력" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <PasswordInput
            label="비밀번호"
            placeholder="방 비밀번호를 입력하세요"
            required
            {...form.getInputProps('password')}
          />
          <Button type="submit" loading={loading} fullWidth mt="md">
            참여하기
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
