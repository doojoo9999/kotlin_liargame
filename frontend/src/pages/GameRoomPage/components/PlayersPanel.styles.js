export const getPlayersPanelStyles = (theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[2],
    width: '100%'
  },
  
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: theme.spacing[4],
    width: '100%',
    justifyItems: 'center'
  },
  
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    padding: theme.semanticSpacing.component.xl,
    textAlign: 'center',
    border: `2px dashed ${theme.colors.border.secondary}`,
    borderRadius: theme.semanticBorderRadius.card.medium,
    backgroundColor: theme.colors.surface.secondary,
    minHeight: '200px'
  },
  
  cardContainer: (isTurn) => ({
    position: 'relative',
    width: '160px',
    height: '120px',
    backgroundColor: theme.colors.surface.primary,
    border: isTurn ? `2px solid ${theme.colors.primary[500]}` : `1px solid ${theme.colors.border.primary}`,
    borderRadius: theme.semanticBorderRadius.card.medium,
    boxShadow: isTurn 
      ? `0 0 16px rgba(99, 102, 241, 0.3), ${theme.shadows.md}`
      : theme.semanticShadows.card.default,
    cursor: 'pointer',
    overflow: 'hidden',
    transition: theme.semanticTransitions.card.hover,
    transform: 'translateY(0)',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows.lg,
      borderColor: theme.colors.border.secondary
    },
    '&:active': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows.md
    }
  }),
  
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing[3],
    height: '100%',
    gap: theme.spacing[1]
  },
  
  topSection: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[1]
  },
  
  avatarContainer: {
    position: 'relative',
    flexShrink: 0
  },
  
  statusDot: (isOnline) => ({
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: `2px solid ${theme.colors.surface.primary}`,
    backgroundColor: isOnline ? theme.colors.success[500] : theme.colors.text.tertiary,
    zIndex: 2
  }),
  
  playerInfo: {
    flex: 1,
    minWidth: 0
  },
  
  playerNickname: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  
  roleBadge: (role) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing[1],
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    borderRadius: theme.semanticBorderRadius.badge.small,
    backgroundColor: role === 'LIAR' ? theme.colors.error[100] : theme.colors.success[100],
    color: role === 'LIAR' ? theme.colors.error[700] : theme.colors.success[700],
    border: `1px solid ${role === 'LIAR' ? theme.colors.error[200] : theme.colors.success[200]}`
  }),
  
  bottomSection: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[1]
  },
  
  statusText: (status) => ({
    fontSize: theme.typography.sizes.xs,
    color: status === 'ONLINE' ? theme.colors.success[600] : theme.colors.text.tertiary,
    fontWeight: theme.typography.weights.medium
  }),
  
  actionButtons: {
    display: 'flex',
    gap: theme.spacing[1],
    justifyContent: 'flex-end'
  },
  
  actionButton: (variant = 'default') => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    padding: 0,
    border: 'none',
    borderRadius: theme.semanticBorderRadius.button.small,
    backgroundColor: variant === 'danger' ? theme.colors.error[100] : theme.colors.surface.secondary,
    color: variant === 'danger' ? theme.colors.error[600] : theme.colors.text.secondary,
    cursor: 'pointer',
    transition: theme.semanticTransitions.button.hover,
    '&:hover': {
      backgroundColor: variant === 'danger' ? theme.colors.error[200] : theme.colors.surface.tertiary
    }
  })
})

export const getResponsiveStyles = (theme) => ({
  grid: {
    '@media (max-width: 767px)': {
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: theme.spacing[3]
    },
    '@media (min-width: 768px) and (max-width: 1023px)': {
      gridTemplateColumns: 'repeat(3, 1fr)'
    },
    '@media (min-width: 1024px)': {
      gridTemplateColumns: 'repeat(4, 1fr)'
    }
  },
  
  cardContainer: {
    '@media (max-width: 767px)': {
      width: '140px',
      height: '100px'
    }
  }
})
