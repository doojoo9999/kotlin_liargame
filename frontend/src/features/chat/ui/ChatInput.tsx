import {zodResolver} from '@hookform/resolvers/zod';
import {ActionIcon, Group, TextInput} from '@mantine/core';
import {Send} from 'lucide-react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useRef} from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const chatSchema = z.object({
  message: z.string().min(1, '메시지를 입력하세요.'),
});
type ChatFormInputs = z.infer<typeof chatSchema>;

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ChatFormInputs>({
    resolver: zodResolver(chatSchema),
  });

  const onSubmit = (data: ChatFormInputs) => {
    onSendMessage(data.message);
    reset();
    inputRef.current?.focus(); // 메시지 전송 후 포커스 유지
  };

  return (
    <form onSubmit={e => void handleSubmit(onSubmit)(e)}>
      <Group gap="xs">
        <TextInput
          style={{ flexGrow: 1 }}
          placeholder="메시지를 입력하세요..."
          disabled={disabled ?? isSubmitting}
          {...register('message')}
          ref={inputRef}
        />
        <ActionIcon type="submit" size="lg" loading={isSubmitting} disabled={disabled ?? isSubmitting}>
          <Send size={18} />
        </ActionIcon>
      </Group>
    </form>
  );
}
