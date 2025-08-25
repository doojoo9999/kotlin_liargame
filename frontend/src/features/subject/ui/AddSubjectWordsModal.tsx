import {zodResolver} from '@hookform/resolvers/zod';
import {Alert, Button, Modal, Stack, Textarea, TextInput} from '@mantine/core';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useApplySubjectWithWordsMutation} from '../hooks/useApplySubjectWithWordsMutation';
import {AlertCircle} from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, '주제를 입력하세요'),
  wordsRaw: z.string().optional(),
});

export type AddSubjectWordsForm = z.infer<typeof schema>;

interface AddSubjectWordsModalProps {
  opened: boolean;
  onClose: () => void;
}

export function AddSubjectWordsModal({ opened, onClose }: AddSubjectWordsModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddSubjectWordsForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', wordsRaw: '' },
  });

  const mutation = useApplySubjectWithWordsMutation();

  const onSubmit = (values: AddSubjectWordsForm) => {
    const words = (values.wordsRaw || '')
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    mutation.mutate(
      { name: values.name.trim(), words },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  return (
    <Modal opened={opened} onClose={onClose} title="주제/답안 추가" centered size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          {mutation.isError && (
            <Alert icon={<AlertCircle size={16} />} color="red" variant="light" title="오류">
              등록에 실패했습니다. 잠시 후 다시 시도해 주세요.
            </Alert>
          )}
          <TextInput
            label="주제 이름"
            placeholder="예: 동물"
            required
            error={errors.name?.message}
            {...register('name')}
          />
          <Textarea
            label="답안(단어) 목록"
            placeholder="각 줄에 하나씩 입력하거나, 쉼표로 구분하여 입력하세요"
            minRows={6}
            autosize
            {...register('wordsRaw')}
          />
          <Button type="submit" loading={mutation.isPending} fullWidth mt="md">
            추가하기
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
