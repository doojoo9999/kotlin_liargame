import {zodResolver} from '@hookform/resolvers/zod';
import {ActionIcon, Alert, Group, TextInput} from '@mantine/core';
import {AlertCircle, Send} from 'lucide-react';
import {Controller, useForm} from 'react-hook-form';
import {z} from 'zod';
import {useRef, useState} from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void> | void;
  disabled?: boolean;
}

const chatSchema = z.object({
  message: z.string().min(1, '메시지를 입력하세요.'),
});
type ChatFormInputs = z.infer<typeof chatSchema>;

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting, errors },
    getValues,
  } = useForm<ChatFormInputs>({
    resolver: zodResolver(chatSchema),
    mode: 'onChange',
    defaultValues: {
      message: ''
    }
  });

  // watch를 사용하여 메시지 입력 상태를 실시간 감지
  const messageValue = watch('message');
  const hasMessage = messageValue && messageValue.trim().length > 0;

  const onSubmit = async (data: ChatFormInputs) => {
    try {
      console.log('[ChatInput] === MESSAGE SEND START ===');
      console.log('[ChatInput] Form data:', data);
      console.log('[ChatInput] onSendMessage function:', onSendMessage);
      console.log('[ChatInput] Message content:', data.message);

      setSendError(null);

      console.log('[ChatInput] Calling onSendMessage...');
      await onSendMessage(data.message);
      console.log('[ChatInput] onSendMessage completed successfully');

      reset();
      inputRef.current?.focus(); // 메시지 전송 후 포커스 유지
      console.log('[ChatInput] === MESSAGE SEND END ===');
    } catch (error) {
      console.error('[ChatInput] === MESSAGE SEND ERROR ===');
      console.error('[ChatInput] Failed to send message:', error);
      setSendError('메시지 전송에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 폼 제출 핸들러
  const submitHandler = handleSubmit(
    (data) => {
      console.log('[ChatInput] Form validation SUCCESS, calling onSubmit:', data);
      onSubmit(data);
    },
    (errors) => {
      console.error('[ChatInput] Form validation FAILED:', errors);
    }
  );

  // 엔터 키 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log('[ChatInput] Key pressed:', e.key);
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('[ChatInput] Enter key pressed, submitting form');
      console.log('[ChatInput] Current form values:', getValues());
      console.log('[ChatInput] Form errors:', errors);
      submitHandler();
    }
  };

  return (
    <>
      {sendError && (
        <Alert icon={<AlertCircle size={16} />} color="red" variant="light" mb="xs">
          {sendError}
        </Alert>
      )}
      <form onSubmit={submitHandler}>
        <Group gap="xs">
          <Controller
            name="message"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                style={{ flexGrow: 1 }}
                placeholder="메시지를 입력하세요..."
                disabled={disabled ?? isSubmitting}
                onKeyDown={handleKeyDown}
                ref={inputRef}
                error={errors.message?.message}
              />
            )}
          />
          <ActionIcon
            type="submit"
            size="lg"
            loading={isSubmitting}
            disabled={disabled ?? isSubmitting ?? !hasMessage}
            variant={hasMessage ? 'filled' : 'light'}
            color={hasMessage ? 'blue' : 'gray'}
          >
            <Send size={18} />
          </ActionIcon>
        </Group>
      </form>
    </>
  );
}
