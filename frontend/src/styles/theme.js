import {createTheme} from '@mantine/core';

export const theme = createTheme({
  fontFamily: 'SeoulAlrimTTF-Heavy, sans-serif',
  primaryColor: 'blue',
  colors: {
    blue: [
      '#e7f5ff',
      '#d0ebff',
      '#a5d8ff',
      '#74c0fc',
      '#4dabf7',
      '#339af0',
      '#228be6',
      '#1c7ed6',
      '#1971c2',
      '#1864ab'
    ],
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Paper: {
      defaultProps: {
        shadow: 'sm',
        p: 'md',
        withBorder: true,
      },
    },
  },
});
