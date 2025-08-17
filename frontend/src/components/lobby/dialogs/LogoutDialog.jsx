import React from 'react';
import {Button, Group, Modal, Text} from '@mantine/core';

/**
 * A confirmation dialog for logging out.
 * @param {object} props - The component props.
 * @param {boolean} props.open - Whether the dialog is open.
 * @param {Function} props.onClose - Function to call when the dialog should close.
 * @param {Function} props.onConfirm - Function to call when the logout is confirmed.
 * @param {object} props.currentUser - The current user object to display their nickname.
 */
const LogoutDialog = ({ open, onClose, onConfirm, currentUser }) => {
  return (
    <Modal
      opened={open}
      onClose={onClose}
      title={<Text fw={700}>로그아웃</Text>}
      centered
      size="sm"
    >
      <Text><strong>{currentUser?.nickname}</strong>님, 정말로 로그아웃하시겠습니까?</Text>
      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={onClose}>취소</Button>
        <Button color="red" onClick={onConfirm}>로그아웃</Button>
      </Group>
    </Modal>
  );
};

export default LogoutDialog;