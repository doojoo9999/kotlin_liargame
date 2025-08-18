export const getChatPanelStyles = (theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.semanticBorderRadius.card.medium,
    boxShadow: theme.semanticShadows.card.default,
    overflow: 'hidden'
  },
  
  messageListContainer: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: theme.semanticSpacing.component.sm,
    scrollBehavior: 'smooth'
  },
  
  messagesContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    gap: theme.spacing[1]
  },
  
  bubbleContainer: (isUser, isSystem) => ({
    display: 'flex',
    margin: `${theme.spacing[1]} 0`,
    maxWidth: '100%',
    justifyContent: isSystem ? 'center' : (isUser ? 'flex-end' : 'flex-start')
  }),
  
  messageBubble: (variant, theme) => {
    const baseStyles = {
      position: 'relative',
      maxWidth: '70%',
      padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
      borderRadius: '18px',
      wordWrap: 'break-word',
      wordBreak: 'break-word'
    }
    
    switch (variant) {
      case 'user':
        return {
          ...baseStyles,
          backgroundColor: theme.colors.primary[500],
          color: 'white',
          borderBottomRightRadius: '4px'
        }
      case 'other':
        return {
          ...baseStyles,
          backgroundColor: theme.colors.surface.secondary,
          color: theme.colors.text.primary,
          borderBottomLeftRadius: '4px'
        }
      case 'system':
        return {
          ...baseStyles,
          backgroundColor: theme.colors.surface.tertiary,
          color: theme.colors.text.secondary,
          fontSize: theme.typography.sizes.sm,
          fontStyle: 'italic',
          textAlign: 'center',
          maxWidth: '90%'
        }
      default:
        return baseStyles
    }
  },
  
  messageContent: {
    lineHeight: 1.4,
    whiteSpace: 'pre-wrap'
  },
  
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[1],
    marginBottom: theme.spacing[1]
  },
  
  senderName: (isUser, theme) => ({
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: isUser ? 'rgba(255, 255, 255, 0.8)' : theme.colors.text.secondary
  }),
  
  timestamp: (isUser, theme) => ({
    fontSize: theme.typography.sizes.xs,
    color: isUser ? 'rgba(255, 255, 255, 0.6)' : theme.colors.text.tertiary
  }),
  
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[2],
    padding: theme.semanticSpacing.component.sm,
    borderTop: `1px solid ${theme.colors.border.primary}`,
    backgroundColor: theme.colors.surface.secondary
  },
  
  inputField: {
    flex: 1,
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: theme.semanticBorderRadius.input.medium,
    fontSize: theme.typography.sizes.sm,
    backgroundColor: theme.colors.surface.primary,
    color: theme.colors.text.primary,
    '&:focus': {
      outline: 'none',
      borderColor: theme.colors.primary[500],
      boxShadow: `0 0 0 2px ${theme.colors.primary[100]}`
    }
  },
  
  sendButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    padding: 0,
    border: 'none',
    borderRadius: theme.semanticBorderRadius.button.medium,
    backgroundColor: theme.colors.primary[500],
    color: 'white',
    cursor: 'pointer',
    transition: theme.semanticTransitions.button.hover,
    '&:hover': {
      backgroundColor: theme.colors.primary[600]
    },
    '&:disabled': {
      backgroundColor: theme.colors.surface.tertiary,
      color: theme.colors.text.tertiary,
      cursor: 'not-allowed'
    }
  },
  
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[4]
  },
  
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    padding: theme.spacing[4],
    textAlign: 'center',
    color: theme.colors.text.secondary
  },
  
  scrollbar: {
    '&::-webkit-scrollbar': {
      width: '6px'
    },
    '&::-webkit-scrollbar-track': {
      background: theme.colors.surface.secondary,
      borderRadius: theme.borderRadius.full
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.colors.border.secondary,
      borderRadius: theme.borderRadius.full,
      '&:hover': {
        background: theme.colors.text.tertiary
      }
    }
  }
})

export const getResponsiveStyles = (theme) => ({
  container: {
    '@media (max-width: 767px)': {
      borderRadius: theme.semanticBorderRadius.card.small
    }
  },
  
  messageListContainer: {
    '@media (max-width: 767px)': {
      padding: theme.semanticSpacing.component.xs
    }
  }
})
