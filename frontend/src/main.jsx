import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import {createTheme, CssBaseline, ThemeProvider} from '@mui/material'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import './index.css'

// React Query client with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 }
  }
})

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
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  </ThemeProvider>,
)