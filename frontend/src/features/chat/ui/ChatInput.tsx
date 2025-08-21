import {zodResolver} from '@hookform/resolvers/zod';
import {ActionIcon, Group, TextInput} from '@mantine/core';
import {Send} from 'lucide-react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const chatSchema = z.object({
  message: z.string().min(1, '메시지를 입력하세요.'),
});
type ChatFormInputs = z.infer<typeof chatSchema>;

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
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
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Group gap="xs">
        <TextInput
          style={{ flexGrow: 1 }}
          placeholder="메시지를 입력하세요..."
          disabled={disabled || isSubmitting}
          {...register('message')}
        />
        <ActionIcon type="submit" size="lg" loading={isSubmitting} disabled={disabled}>
          <Send size={18} />
        </ActionIcon>
      </Group>
    </form>
  );
}
