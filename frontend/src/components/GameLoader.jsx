import React from 'react';
import PropTypes from 'prop-types';
import {Box, Text} from '@mantine/core';
import {motion} from 'framer-motion';

export function GameLoader({ text = '로딩 중...' }) {
  return (
    <Box ta="center" py="xl">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'inline-block' }}
      >
        🎮
      </motion.div>
      <Text mt="sm" c="white" size="lg">
        {text}
      </Text>
    </Box>
  );
}

GameLoader.propTypes = {
  text: PropTypes.string,
};
