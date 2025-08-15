export const gameTheme = {
  mode: 'dark',
  colors: {
    primary: '#FF6B6B', // 생동감 있는 빨강
    primaryLight: '#FF8E8E',
    primaryDark: '#E55555',
    secondary: '#4ECDC4', // 청록색
    secondaryLight: '#7ED3CC', 
    secondaryDark: '#3BA99C',
    accent: '#FFE66D', // 라이어 강조색
    accentLight: '#FFEF96',
    accentDark: '#E6C74A',
    
    // Game specific colors
    liar: '#FF4757',
    citizen: '#5352ED', 
    speaking: '#FF9F43',
    voting: '#C44569',
    waiting: '#7FB069',
    
    // System colors
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
    success: '#4caf50',
    
    // Background colors
    background: {
      default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      paper: 'rgba(255, 255, 255, 0.05)'
    },
    
    // Text colors
    text: {
      primary: 'rgba(255, 255, 255, 0.87)',
      secondary: 'rgba(255, 255, 255, 0.6)',
      disabled: 'rgba(255, 255, 255, 0.38)'
    },
    
    // Divider and borders
    divider: 'rgba(255, 255, 255, 0.12)',
    
    // Action colors
    action: {
      hover: 'rgba(255, 255, 255, 0.04)',
      selected: 'rgba(255, 255, 255, 0.08)',
      disabled: 'rgba(255, 255, 255, 0.26)',
      focus: 'rgba(255, 255, 255, 0.12)'
    }
  },
  
  typography: {
    fontFamily: '"Pretendard", "Noto Sans KR", sans-serif',
    h1: { fontWeight: 800 },
    gameTitle: {
      fontSize: '2.5rem',
      fontWeight: 900,
      background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      color: 'transparent'
    }
  },
  
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '16px'
  }
}