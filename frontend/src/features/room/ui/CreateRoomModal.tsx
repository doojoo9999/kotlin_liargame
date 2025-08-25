import {zodResolver} from '@hookform/resolvers/zod';
import {Alert, Button, Group, Modal, Radio, Slider, Stack, Switch, Text, TextInput} from '@mantine/core';
import {Controller, useForm} from 'react-hook-form';
import {useCreateRoomMutation} from '../hooks/useCreateRoomMutation';
import type {CreateRoomFormInputs} from './createRoomSchema';
import {createRoomSchema} from './createRoomSchema';
import {useUserStore} from '../../../shared/stores/userStore';
import {useEffect, useState} from 'react';
import {AlertCircle, Check} from 'lucide-react';

interface CreateRoomModalProps {
  opened: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ opened, onClose }: CreateRoomModalProps) {
  const { nickname } = useUserStore();
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateRoomFormInputs>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      gameName: nickname ? `${nickname}님의 방` : '',
      gamePassword: '',
      gameParticipants: 5,
      gameTotalRounds: 3,
      gameLiarCount: 1,
      gameMode: 'LIARS_KNOW',
      useRandomSubjects: true,
      randomSubjectCount: 3,
      subjectIds: [],
    },
  });

  const createRoomMutation = useCreateRoomMutation();
  const watchedParticipants = watch('gameParticipants');
  const watchedLiarCount = watch('gameLiarCount');

  useEffect(() => {
    if (opened) {
      setShowSuccess(false);
      setErrorMessage('');
      setIsCustomTitle(false);
      // 모달이 열릴 때마다 닉네임 기반 기본 제목 설정
      if (nickname) {
        setValue('gameName', `${nickname}님의 방`);
      }
    }
  }, [opened, nickname, setValue]);

  // 라이어 수가 참가자 수를 초과하지 않도록 제한
  useEffect(() => {
    if (watchedLiarCount >= watchedParticipants) {
      setValue('gameLiarCount', Math.max(1, watchedParticipants - 1));
    }
  }, [watchedParticipants, watchedLiarCount, setValue]);

  const handleTitleClick = () => {
    if (!isCustomTitle) {
      setIsCustomTitle(true);
      setValue('gameName', '');
    }
  };

  const onSubmit = (data: CreateRoomFormInputs) => {
    setErrorMessage('');
    setShowSuccess(false);

    // 세션에서 닉네임을 가져와서 백엔드로 전송할 데이터 구성
    const submitData = {
      ...data,
      nickname: nickname, // 세션에서 가져온 닉네임
      gamePassword: data.gamePassword?.trim() || undefined,
    };

    createRoomMutation.mutate(submitData, {
      onSuccess: () => {
        setShowSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      },
      onError: (error: any) => {
        if (error?.response?.data?.message) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage('방 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        }
      },
    });
  };

  const handleClose = () => {
    setShowSuccess(false);
    setErrorMessage('');
    setIsCustomTitle(false);
    reset();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="새로운 방 만들기" centered size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          {errorMessage && (
            <Alert icon={<AlertCircle size={16} />} color="red" variant="light" title="오류">
              {errorMessage}
            </Alert>
          )}

          {showSuccess && (
            <Alert icon={<Check size={16} />} color="green" variant="light" title="성공">
              방이 성공적으로 생성되었습니다!
            </Alert>
          )}

          {/* 방 제목 */}
          <TextInput
            label="방 제목"
            placeholder={isCustomTitle ? "원하는 방 제목을 입력하세요" : "클릭하여 방 제목을 변경하세요"}
            required
            error={errors.gameName?.message}
            onClick={handleTitleClick}
            style={!isCustomTitle ? { cursor: 'pointer' } : undefined}
            {...register('gameName')}
          />

          {/* 비밀번호 (선택사항) */}
          <TextInput
            label="비밀번호 (선택사항)"
            placeholder="비공개 방으로 만들려면 입력하세요"
            type="password"
            error={errors.gamePassword?.message}
            {...register('gamePassword')}
          />

          {/* 게임 모드 */}
          <div>
            <Text size="sm" fw={500} mb="xs">게임 모드</Text>
            <Controller
              name="gameMode"
              control={control}
              render={({ field }) => (
                <Radio.Group {...field}>
                  <Stack gap="xs">
                    <Radio
                      value="LIARS_KNOW"
                      label="라이어인 것을 아는 모드"
                      description="라이어가 자신이 라이어임을 알고 있습니다"
                    />
                    <Radio
                      value="LIARS_DIFFERENT_WORD"
                      label="라이어가 다른 답을 받는 모드"
                      description="라이어가 시민과 다른 주제를 받습니다"
                    />
                  </Stack>
                </Radio.Group>
              )}
            />
          </div>

          {/* 최대 인원 */}
          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>최대 인원</Text>
              <Text size="sm" c="dimmed">{watchedParticipants}명</Text>
            </Group>
            <Controller
              name="gameParticipants"
              control={control}
              render={({ field }) => (
                <Slider
                  {...field}
                  min={3}
                  max={15}
                  step={1}
                  marks={[
                    { value: 3, label: '3명' },
                    { value: 8, label: '8명' },
                    { value: 15, label: '15명' },
                  ]}
                />
              )}
            />
            {errors.gameParticipants && (
              <Text size="xs" c="red" mt="xs">{errors.gameParticipants.message}</Text>
            )}
          </div>

          {/* 총 라운드 */}
          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>총 라운드</Text>
              <Text size="sm" c="dimmed">{watch('gameTotalRounds')}라운드</Text>
            </Group>
            <Controller
              name="gameTotalRounds"
              control={control}
              render={({ field }) => (
                <Slider
                  {...field}
                  min={1}
                  max={10}
                  step={1}
                  marks={[
                    { value: 1, label: '1라운드' },
                    { value: 5, label: '5라운드' },
                    { value: 10, label: '10라운드' },
                  ]}
                />
              )}
            />
            {errors.gameTotalRounds && (
              <Text size="xs" c="red" mt="xs">{errors.gameTotalRounds.message}</Text>
            )}
          </div>

          {/* 라이어 수 */}
          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>라이어 수</Text>
              <Text size="sm" c="dimmed">{watchedLiarCount}명</Text>
            </Group>
            <Controller
              name="gameLiarCount"
              control={control}
              render={({ field }) => (
                <Slider
                  {...field}
                  min={1}
                  max={Math.min(5, Math.max(1, watchedParticipants - 1))}
                  step={1}
                  marks={[
                    { value: 1, label: '1명' },
                    { value: Math.min(3, Math.max(1, watchedParticipants - 1)), label: `${Math.min(3, Math.max(1, watchedParticipants - 1))}명` },
                    { value: Math.min(5, Math.max(1, watchedParticipants - 1)), label: `${Math.min(5, Math.max(1, watchedParticipants - 1))}명` },
                  ].filter((mark, index, array) =>
                    array.findIndex(m => m.value === mark.value) === index
                  )}
                />
              )}
            />
            {errors.gameLiarCount && (
              <Text size="xs" c="red" mt="xs">{errors.gameLiarCount.message}</Text>
            )}
          </div>

          {/* 주제 설정 */}
          <div>
            <Text size="sm" fw={500} mb="xs">주제 설정</Text>
            <Controller
              name="useRandomSubjects"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <Switch
                  {...field}
                  checked={value}
                  onChange={onChange}
                  label="랜덤 주제 사용"
                  description="체크하면 게임에서 랜덤하게 주제를 선택합니다"
                />
              )}
            />

            {watch('useRandomSubjects') && (
              <div style={{ marginTop: '12px' }}>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>랜덤 주제 개수</Text>
                  <Text size="sm" c="dimmed">{watch('randomSubjectCount')}개</Text>
                </Group>
                <Controller
                  name="randomSubjectCount"
                  control={control}
                  render={({ field }) => (
                    <Slider
                      {...field}
                      min={1}
                      max={5}
                      step={1}
                      marks={[
                        { value: 1, label: '1개' },
                        { value: 3, label: '3개' },
                        { value: 5, label: '5개' },
                      ]}
                    />
                  )}
                />
              </div>
            )}
          </div>

          <Button type="submit" loading={createRoomMutation.isPending} fullWidth mt="lg" size="md">
            방 만들기
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
