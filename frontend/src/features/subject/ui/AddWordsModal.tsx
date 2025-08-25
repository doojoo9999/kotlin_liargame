import {zodResolver} from '@hookform/resolvers/zod';
import {Alert, Button, Group, Modal, Select, Stack, TextInput} from '@mantine/core';
import {Controller, useForm} from 'react-hook-form';
import {z} from 'zod';
import {useApplyWordMutation} from '../hooks/useApplyWordMutation';
import {useSubjectsQuery} from '../hooks/useSubjectsQuery';
import {AlertCircle, Check} from 'lucide-react';
import {useEffect, useState} from 'react';

const schema = z.object({
  subject: z.string().min(1, '주제를 선택하세요'),
  word: z.string().min(1, '답안을 입력하세요').max(50, '답안은 50자 이하로 입력하세요'),
});

export type AddWordsForm = z.infer<typeof schema>;

interface AddWordsModalProps {
  opened: boolean;
  onClose: () => void;
}

export function AddWordsModal({ opened, onClose }: AddWordsModalProps) {
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<AddWordsForm>({
    resolver: zodResolver(schema),
    defaultValues: { subject: '', word: '' },
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [lastAddedWord, setLastAddedWord] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: subjects, isLoading: isLoadingSubjects, refetch } = useSubjectsQuery();
  const mutation = useApplyWordMutation();

  // Refetch subjects when modal opens to ensure we have the latest data
  useEffect(() => {
    if (opened) {
      // 모달이 열릴 때 즉시 새로고침하고 약간의 지연 후 한 번 더 새로고침
      refetch();

      // 짧은 지연 후 한 번 더 새로고침 (WebSocket 이벤트 처리 시간 고려)
      const timeoutId = setTimeout(() => {
        refetch();
      }, 500);

      setShowSuccess(false);
      setErrorMessage('');

      return () => clearTimeout(timeoutId);
    }
  }, [opened, refetch]);

  const onSubmit = (values: AddWordsForm) => {
    setErrorMessage('');
    setShowSuccess(false);

    mutation.mutate(
      { subject: values.subject, words: [values.word.trim()] },
      {
        onSuccess: () => {
          setLastAddedWord(values.word.trim());
          setShowSuccess(true);
          // 주제는 유지하고 답안 입력 필드만 초기화
          reset({ subject: values.subject, word: '' });

          // Hide success message after 3 seconds
          setTimeout(() => {
            setShowSuccess(false);
          }, 3000);
        },
        onError: (error: any) => {
          // Extract specific error message from response
          if (error?.response?.data?.message) {
            setErrorMessage(error.response.data.message);
          } else if (error?.message) {
            setErrorMessage(error.message);
          } else {
            setErrorMessage('답안 추가에 실패했습니다. 잠시 후 다시 시도해 주세요.');
          }
        },
      }
    );
  };

  const subjectOptions = subjects?.map(subject => ({
    value: subject.name,
    label: subject.name,
  })) || [];

  const handleClose = () => {
    setShowSuccess(false);
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="답안 추가" centered size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          {errorMessage && (
            <Alert icon={<AlertCircle size={16} />} color="red" variant="light" title="오류">
              {errorMessage}
            </Alert>
          )}

          {showSuccess && (
            <Alert icon={<Check size={16} />} color="green" variant="light" title="성공">
              답안 '{lastAddedWord}'가 성공적으로 추가되었습니다.
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
                disabled={isLoadingSubjects}
                searchable
                {...field}
              />
            )}
          />

          <TextInput
            label="답안(단어)"
            placeholder="예: 사자"
            required
            error={errors.word?.message}
            {...register('word')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={handleClose}>
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
