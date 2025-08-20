import {Container, Paper, Text, Title} from '@mantine/core';
import {motion} from 'framer-motion';
import {LoginForm} from '@/features/auth';

export const LoginPage = () => {
  return (
    <Container size="xs" style={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%' }}
      >
        <Paper withBorder shadow="xl" p={30} radius="lg">
          <Title order={2} ta="center">
            Welcome to Liar Game!
          </Title>
          <Text c="dimmed" size="sm" ta="center" mt={5} mb="xl">
            Enter your nickname to begin
          </Text>
          <LoginForm />
        </Paper>
      </motion.div>
    </Container>
  );
};
