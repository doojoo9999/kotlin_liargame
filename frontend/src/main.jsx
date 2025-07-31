import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import {createTheme, CssBaseline, ThemeProvider} from '@mui/material'
import './index.css'

// Create a custom theme with bright and friendly colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#4caf50', // Green color for primary elements
    },
    secondary: {
      main: '#ff9800', // Orange color for secondary elements
    },
    background: {
      default: '#f5f5f5', // Light gray background
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)