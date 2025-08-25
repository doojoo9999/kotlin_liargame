import {zodResolver} from '@hookform/resolvers/zod';
import {Alert, Button, Group, Modal, Select, Stack, Textarea} from '@mantine/core';
import {Controller, useForm} from 'react-hook-form';
import {z} from 'zod';
import {useApplyWordMutation} from '../hooks/useApplyWordMutation';
import {useSubjectsQuery} from '../hooks/useSubjectsQuery';
import {AlertCircle} from 'lucide-react';
import {useEffect} from 'react';

const schema = z.object({
  subject: z.string().min(1, '주제를 선택하세요'),
  wordsRaw: z.string().min(1, '답안을 입력하세요'),
});

export type AddWordsForm = z.infer<typeof schema>;

interface AddWordsModalProps {
  opened: boolean;
  onClose: () => void;
  preSelectedSubject?: string;
}

export function AddWordsModal({ opened, onClose, preSelectedSubject }: AddWordsModalProps) {
  const { control, register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AddWordsForm>({
    resolver: zodResolver(schema),
    defaultValues: { subject: '', wordsRaw: '' },
  });

  const { data: subjects, isLoading: isLoadingSubjects } = useSubjectsQuery();
  const mutation = useApplyWordMutation();

  // Set pre-selected subject when provided
  useEffect(() => {
    if (preSelectedSubject) {
      setValue('subject', preSelectedSubject);
    }
  }, [preSelectedSubject, setValue]);

  const onSubmit = (values: AddWordsForm) => {
    const words = values.wordsRaw
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    mutation.mutate(
      { subject: values.subject, words },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  const subjectOptions = subjects?.map(subject => ({
    value: subject.name,
    label: subject.name,
  })) || [];

  return (
    <Modal opened={opened} onClose={onClose} title="답안 추가" centered size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          {mutation.isError && (
            <Alert icon={<AlertCircle size={16} />} color="red" variant="light" title="오류">
              답안 추가에 실패했습니다. 잠시 후 다시 시도해 주세요.
            </Alert>
          )}

          <Controller
            name="subject"
            control={control}
            render={({ field }) => (
              <Select
                label="주제 선택"
                placeholder="주제를 선택하세요"
                required
                data={subjectOptions}
                error={errors.subject?.message}
                disabled={isLoadingSubjects || !!preSelectedSubject}
                {...field}
              />
            )}
          />

          <Textarea
            label="답안(단어) 목록"
            placeholder="각 줄에 하나씩 입력하거나, 쉼표로 구분하여 입력하세요&#10;예:&#10;사자&#10;호랑이&#10;코끼리"
            minRows={6}
            autosize
            required
            error={errors.wordsRaw?.message}
            {...register('wordsRaw')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              답안 추가
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
