import {createTheme, MantineColorsTuple} from '@mantine/core';

// Linear.app 스타일 다크 컬러 팔레트
const gameNeon: MantineColorsTuple = [
  '#f0f9ff', // 0 - 매우 연한 파란색 (라이트 모드용)
  '#e0f2fe', // 1 - 연한 파란색
  '#bae6fd', // 2 - 밝은 파란색
  '#7dd3fc', // 3 - 하늘색
  '#38bdf8', // 4 - 기본 파란색
  '#0ea5e9', // 5 - 메인 컬러 (Linear blue)
  '#0284c7', // 6 - 진한 파란색
  '#0369a1', // 7 - 더 진한 파란색
  '#075985', // 8 - 매우 진한 파란색
  '#0c4a6e', // 9 - 가장 진한 파란색
];

const gameGreen: MantineColorsTuple = [
  '#f0fdf4', // 성공 상태용
  '#dcfce7',
  '#bbf7d0',
  '#86efac',
  '#4ade80',
  '#22c55e', // 메인 그린
  '#16a34a',
  '#15803d',
  '#166534',
  '#14532d',
];

const gameRed: MantineColorsTuple = [
  '#fef2f2', // 위험 상태용
  '#fee2e2',
  '#fecaca',
  '#fca5a5',
  '#f87171',
  '#ef4444', // 메인 레드
  '#dc2626',
  '#b91c1c',
  '#991b1b',
  '#7f1d1d',
];

// 다크 테마 색상 정의
const darkColors = [
  '#C1C2C5', // 0 - 가장 밝은 텍스트
  '#A6A7AB', // 1 - 보조 텍스트
  '#909296', // 2 - 비활성 텍스트
  '#5C5F66', // 3 - 구분선
  '#373A40', // 4 - 카드 배경
  '#2C2E33', // 5 - 패널 배경
  '#25262B', // 6 - 메인 배경
  '#1A1B1E', // 7 - 더 어두운 배경
  '#141517', // 8 - 가장 어두운 배경
  '#101113', // 9 - 절대 어둠
] as MantineColorsTuple;

export const theme = createTheme({
  primaryColor: 'gameNeon',

  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontWeight: '600',
  },

  // 통합된 색상 정의 (중복 제거)
  colors: {
    dark: darkColors,
    gameNeon,
    gameGreen,
    gameRed,
  },

  defaultRadius: 'md',

  components: {
    Container: {
      defaultProps: {
        size: 'xl',
      },
    },

    Card: {
      styles: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.02)', // 글래스모피즘
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            transform: 'translateY(-2px)',
            boxShadow: `
              0 20px 25px -5px rgba(0, 0, 0, 0.3),
              0 10px 10px -5px rgba(0, 0, 0, 0.2),
              0 0 0 1px rgba(14, 165, 233, 0.2)
            `,
          },
        },
      },
    },

    Button: {
      styles: {
        root: {
          borderRadius: '8px',
          fontWeight: 500,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          border: 'none',

          '&[data-variant="filled"]': {
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            boxShadow: '0 0 20px rgba(14, 165, 233, 0.3)',

            '&:hover': {
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              boxShadow: '0 0 30px rgba(14, 165, 233, 0.5)',
              transform: 'translateY(-1px)',
            },
          },

          '&[data-variant="light"]': {
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            color: '#0ea5e9',
            border: '1px solid rgba(14, 165, 233, 0.2)',

            '&:hover': {
              backgroundColor: 'rgba(14, 165, 233, 0.15)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
            },
          },

          '&[data-variant="subtle"]': {
            backgroundColor: 'transparent',

            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
          },
        },
      },
    },

    Badge: {
      styles: {
        root: {
          borderRadius: '6px',
          fontWeight: 500,
          fontSize: '12px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },

    TextInput: {
      styles: {
        input: {
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',

          '&:focus': {
            borderColor: '#0ea5e9',
            boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.1)',
          },
        },
      },
    },

    Modal: {
      styles: {
        content: {
          backgroundColor: 'rgba(28, 28, 32, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        },
      },
    },

    Tabs: {
      styles: {
        tab: {
          borderRadius: '8px',
          fontWeight: 500,
          transition: 'all 0.2s ease',

          '&[data-active="true"]': {
            backgroundColor: 'rgba(14, 165, 233, 0.15)',
            color: '#0ea5e9',
            border: '1px solid rgba(14, 165, 233, 0.3)',
          },

          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
  },

  // 전역 스타일
  globalStyles: (theme) => ({
    body: {
      background: `
        radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.1) 0%, transparent 50%),
        linear-gradient(135deg, #0c0d0f 0%, #14151a 25%, #1a1b1e 50%, #141517 75%, #0c0d0f 100%)
      `,
      minHeight: '100vh',
      color: theme.colors.dark[0],
    },

    // 커스텀 스크롤바
    '*::-webkit-scrollbar': {
      width: '6px',
    },
    '*::-webkit-scrollbar-track': {
      background: 'rgba(255, 255, 255, 0.02)',
    },
    '*::-webkit-scrollbar-thumb': {
      background: 'rgba(14, 165, 233, 0.3)',
      borderRadius: '3px',

      '&:hover': {
        background: 'rgba(14, 165, 233, 0.5)',
      },
    },
  }),
});
