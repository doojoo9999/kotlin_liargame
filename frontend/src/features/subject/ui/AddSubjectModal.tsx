import {zodResolver} from '@hookform/resolvers/zod';
import {Alert, Button, Modal, Stack, TextInput} from '@mantine/core';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useApplySubjectMutation} from '../hooks/useApplySubjectMutation';
import {AlertCircle, Check} from 'lucide-react';
import {useEffect, useState} from 'react';

const schema = z.object({
  name: z.string().min(1, '주제를 입력하세요').max(30, '주제는 30자 이하로 입력하세요'),
});

export type AddSubjectForm = z.infer<typeof schema>;

interface AddSubjectModalProps {
  opened: boolean;
  onClose: () => void;
}

export function AddSubjectModal({ opened, onClose }: AddSubjectModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddSubjectForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [lastAddedSubject, setLastAddedSubject] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const mutation = useApplySubjectMutation();

  useEffect(() => {
    if (opened) {
      setShowSuccess(false);
      setErrorMessage('');
    }
  }, [opened]);

  const onSubmit = (values: AddSubjectForm) => {
    setErrorMessage('');
    setShowSuccess(false);

    mutation.mutate(values.name.trim(), {
      onSuccess: (response) => {
        setLastAddedSubject(response.name);
        setShowSuccess(true);
        reset();

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
          setErrorMessage('주제 추가에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        }
      },
    });
  };

  const handleClose = () => {
    setShowSuccess(false);
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="주제 추가" centered size="md">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          {errorMessage && (
            <Alert icon={<AlertCircle size={16} />} color="red" variant="light" title="오류">
              {errorMessage}
            </Alert>
          )}

          {showSuccess && (
            <Alert icon={<Check size={16} />} color="green" variant="light" title="성공">
              주제 '{lastAddedSubject}'가 성공적으로 추가되었습니다.
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
