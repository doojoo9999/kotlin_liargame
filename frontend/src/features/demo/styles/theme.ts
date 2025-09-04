import {Theme} from '../types';

export const createGameTheme = (variant: 'dark' | 'light' = 'dark'): Theme => ({
  name: variant,
  colors: {
    background: variant === 'dark' 
      ? 'linear-gradient(135deg, #0f1419 0%, #1a1b1f 50%, #0f1419 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
    cardBg: variant === 'dark' ? '#1e2328' : '#ffffff',
    cardHover: variant === 'dark' ? '#252a31' : '#f1f5f9',
    cardBorder: variant === 'dark' ? '#3d434a' : '#e2e8f0',
    textPrimary: variant === 'dark' ? '#ffffff' : '#0f172a',
    textSecondary: variant === 'dark' ? '#e2e8f0' : '#334155',
    textMuted: variant === 'dark' ? '#94a3b8' : '#64748b',
    accent: {
      primary: variant === 'dark' ? '#60a5fa' : '#3b82f6',
      success: variant === 'dark' ? '#10b981' : '#059669',
      danger: variant === 'dark' ? '#ef4444' : '#dc2626',
      warning: variant === 'dark' ? '#f59e0b' : '#d97706',
      purple: variant === 'dark' ? '#8b5cf6' : '#7c3aed',
      cyan: variant === 'dark' ? '#06b6d4' : '#0891b2'
    },
    online: variant === 'dark' ? '#10b981' : '#059669',
    away: variant === 'dark' ? '#f59e0b' : '#d97706',
    offline: variant === 'dark' ? '#6b7280' : '#9ca3af'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    sm: '6px',
    md: '12px',
    lg: '16px'
  }
});

export const darkTheme = createGameTheme('dark');
export const lightTheme = createGameTheme('light');

// CSS custom properties for theme switching
export const createThemeVariables = (theme: Theme) => `
  :root {
    --color-background: ${theme.colors.background};
    --color-card-bg: ${theme.colors.cardBg};
    --color-card-hover: ${theme.colors.cardHover};
    --color-card-border: ${theme.colors.cardBorder};
    --color-text-primary: ${theme.colors.textPrimary};
    --color-text-secondary: ${theme.colors.textSecondary};
    --color-text-muted: ${theme.colors.textMuted};
    --color-accent-primary: ${theme.colors.accent.primary};
    --color-accent-success: ${theme.colors.accent.success};
    --color-accent-danger: ${theme.colors.accent.danger};
    --color-accent-warning: ${theme.colors.accent.warning};
    --color-accent-purple: ${theme.colors.accent.purple};
    --color-accent-cyan: ${theme.colors.accent.cyan};
    --color-online: ${theme.colors.online};
    --color-away: ${theme.colors.away};
    --color-offline: ${theme.colors.offline};
    --spacing-xs: ${theme.spacing.xs};
    --spacing-sm: ${theme.spacing.sm};
    --spacing-md: ${theme.spacing.md};
    --spacing-lg: ${theme.spacing.lg};
    --spacing-xl: ${theme.spacing.xl};
    --border-radius-sm: ${theme.borderRadius.sm};
    --border-radius-md: ${theme.borderRadius.md};
    --border-radius-lg: ${theme.borderRadius.lg};
  }
`;

export const globalStyles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  @keyframes slideIn {
    from { transform: translateX(-10px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 5px var(--color-accent-primary); }
    50% { box-shadow: 0 0 20px var(--color-accent-primary); }
  }
  
  .game-demo-container {
    min-height: 100vh;
    background: var(--color-background);
    color: var(--color-text-primary);
    font-family: system-ui, -apple-system, sans-serif;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .game-card {
    background: var(--color-card-bg);
    border: 2px solid var(--color-card-border);
    border-radius: var(--border-radius-lg);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fadeInUp 0.6s ease-out;
  }
  
  .game-card:hover {
    background: var(--color-card-hover);
    border-color: var(--color-accent-primary);
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(96, 165, 250, 0.15);
  }
  
  .game-button {
    border-radius: var(--border-radius-sm);
    font-weight: 600;
    transition: all 0.2s ease;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    position: relative;
    overflow: hidden;
  }
  
  .game-button:hover {
    transform: translateY(-1px);
  }
  
  .game-button:active {
    transform: translateY(0);
  }

  .game-button:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }

  .game-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  .animate-slide-in {
    animation: slideIn 0.5s ease-out;
  }
  
  .animate-pulse {
    animation: pulse 2s infinite;
  }

  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }

  .animate-glow {
    animation: glow 2s ease-in-out infinite;
  }
  
  .progress-bar {
    background: var(--color-card-bg);
    border-radius: var(--border-radius-md);
    overflow: hidden;
    border: 1px solid var(--color-card-border);
    position: relative;
  }
  
  .progress-fill {
    height: 100%;
    border-radius: var(--border-radius-md);
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  .player-card {
    position: relative;
  }

  .tooltip-content {
    background: var(--color-card-bg);
    border: 1px solid var(--color-card-border);
    border-radius: var(--border-radius-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--color-text-primary);
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-width: 250px;
  }

  .loading-skeleton {
    background: var(--color-card-border);
    border-radius: var(--border-radius-sm);
    position: relative;
    overflow: hidden;
  }

  .loading-skeleton::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    animation: shimmer 1.5s infinite;
  }

  /* Mobile responsive styles */
  @media (max-width: 768px) {
    .game-demo-container {
      font-size: 14px;
    }
    
    .game-card {
      padding: var(--spacing-md) !important;
    }
    
    .game-button {
      min-height: 44px;
      min-width: 44px;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .game-card {
      border-width: 3px;
    }
    
    .game-button:focus-visible {
      outline-width: 3px;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Print styles */
  @media print {
    .game-demo-container {
      background: white;
      color: black;
    }
    
    .game-card {
      border: 1px solid black;
      background: white;
    }
  }
`;