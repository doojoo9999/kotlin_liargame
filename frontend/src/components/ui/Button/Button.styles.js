// Button 컴포넌트 스타일 정의
export const getButtonStyles = (variant, feedbackState, showFeedback) => ({
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.2s ease',
  ...(feedbackState === 'error' && {
    animation: 'shake 0.5s ease-in-out',
  }),
  ...(feedbackState === 'success' && {
    animation: 'successPulse 0.5s ease-out',
  }),
  ...(showFeedback && {
    '& > *:not(.feedback-icon)': {
      opacity: 0,
    },
  }),
})

export const getVariantStyles = (variant) => {
  switch (variant) {
    case 'liar':
      return {
        backgroundColor: 'var(--mantine-color-red-6)',
        color: 'var(--mantine-color-white)',
        '&:hover': {
          backgroundColor: 'var(--mantine-color-red-7)',
          transform: 'translateY(-1px) scale(1.02)',
        },
        '&:active': {
          backgroundColor: 'var(--mantine-color-red-8)',
          transform: 'translateY(0) scale(1)',
        },
      }
    case 'citizen':
      return {
        backgroundColor: 'var(--mantine-color-blue-6)',
        color: 'var(--mantine-color-white)',
        '&:hover': {
          backgroundColor: 'var(--mantine-color-blue-7)',
          transform: 'translateY(-1px) scale(1.02)',
        },
        '&:active': {
          backgroundColor: 'var(--mantine-color-blue-8)',
          transform: 'translateY(0) scale(1)',
        },
      }
    case 'action':
      return {
        background: 'linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-cyan-6))',
        color: 'var(--mantine-color-white)',
        '&:hover': {
          background: 'linear-gradient(135deg, var(--mantine-color-blue-7), var(--mantine-color-cyan-7))',
          transform: 'translateY(-2px) scale(1.02)',
          boxShadow: 'var(--mantine-shadow-lg)',
        },
        '&:active': {
          transform: 'translateY(-1px) scale(1.01)',
          boxShadow: 'var(--mantine-shadow-md)',
        },
      }
    default:
      return {}
  }
}

export const feedbackIconStyles = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 10,
}

