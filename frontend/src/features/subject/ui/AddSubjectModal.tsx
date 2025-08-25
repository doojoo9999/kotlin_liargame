import {zodResolver} from '@hookform/resolvers/zod';
import {Alert, Button, Modal, Stack, TextInput} from '@mantine/core';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useApplySubjectMutation} from '../hooks/useApplySubjectMutation';
import {AlertCircle} from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, '주제를 입력하세요'),
});

export type AddSubjectForm = z.infer<typeof schema>;

interface AddSubjectModalProps {
  opened: boolean;
  onClose: () => void;
  onSubjectAdded?: (subjectName: string) => void;
}

export function AddSubjectModal({ opened, onClose, onSubjectAdded }: AddSubjectModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddSubjectForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  const mutation = useApplySubjectMutation();

  const onSubmit = (values: AddSubjectForm) => {
    mutation.mutate(values.name.trim(), {
      onSuccess: (response) => {
        reset();
        onClose();
        onSubjectAdded?.(response.name);
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="주제 추가" centered size="md">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          {mutation.isError && (
            <Alert icon={<AlertCircle size={16} />} color="red" variant="light" title="오류">
              주제 추가에 실패했습니다. 잠시 후 다시 시도해 주세요.
            </Alert>
          )}
          <TextInput
            label="주제 이름"
            placeholder="예: 동물"
            required
            error={errors.name?.message}
            {...register('name')}
          />
          <Button type="submit" loading={mutation.isPending} fullWidth mt="md">
            주제 추가
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
