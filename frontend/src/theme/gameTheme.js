import {createTheme} from '@mui/material/styles'

export const gameTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF6B6B', // 생동감 있는 빨강
      light: '#FF8E8E',
      dark: '#E55555'
    },
    secondary: {
      main: '#4ECDC4', // 청록색
      light: '#7ED3CC', 
      dark: '#3BA99C'
    },
    accent: {
      main: '#FFE66D', // 라이어 강조색
      light: '#FFEF96',
      dark: '#E6C74A'
    },
    gameColors: {
      liar: '#FF4757',
      citizen: '#5352ED', 
      speaking: '#FF9F43',
      voting: '#C44569',
      waiting: '#7FB069'
    },
    background: {
      default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      paper: 'rgba(255, 255, 255, 0.05)'
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
  shape: { borderRadius: 16 }
})