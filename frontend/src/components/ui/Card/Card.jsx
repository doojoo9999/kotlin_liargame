import React, {forwardRef} from 'react'
import styled, {css} from 'styled-components'
import {motion} from 'framer-motion'

// Base card styles using design tokens
const BaseCard = styled(motion.div)`
  background-color: ${({ theme }) => theme.colors.surface.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  transition: ${({ theme }) => theme.semanticTransitions.card.hover};
  position: relative;
  overflow: hidden;
`

// Variant styles
const variantStyles = {
  default: css`
    box-shadow: ${({ theme }) => theme.semanticShadows.card.default};
  `,
  
  elevated: css`
    box-shadow: ${({ theme }) => theme.shadows.md};
  `,
  
  hoverable: css`
    box-shadow: ${({ theme }) => theme.semanticShadows.card.default};
    cursor: pointer;
    
    &:hover {
      box-shadow: ${({ theme }) => theme.semanticShadows.card.hover};
      transform: translateY(-2px);
      border-color: ${({ theme }) => theme.colors.border.secondary};
    }
    
    &:active {
      box-shadow: ${({ theme }) => theme.semanticShadows.card.active};
      transform: translateY(-1px);
    }
  `,
  
  interactive: css`
    box-shadow: ${({ theme }) => theme.semanticShadows.card.default};
    cursor: pointer;
    border: 2px solid transparent;
    
    &:hover {
      box-shadow: ${({ theme }) => theme.semanticShadows.card.hover};
      transform: translateY(-2px) scale(1.02);
      border-color: ${({ theme }) => theme.colors.primary[200]};
    }
    
    &:active {
      box-shadow: ${({ theme }) => theme.semanticShadows.card.active};
      transform: translateY(-1px) scale(1.01);
    }
    
    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.border.focus};
      outline-offset: 2px;
    }
  `,
  
  outlined: css`
    background-color: transparent;
    border: 2px solid ${({ theme }) => theme.colors.border.primary};
    box-shadow: ${({ theme }) => theme.shadows.none};
    
    &:hover {
      border-color: ${({ theme }) => theme.colors.primary[300]};
      background-color: ${({ theme }) => theme.colors.primary[50]};
      box-shadow: ${({ theme }) => theme.shadows.sm};
    }
  `
}

// Size/padding variants
const paddingStyles = {
  none: css`
    padding: 0;
  `,
  sm: css`
    padding: ${({ theme }) => theme.semanticSpacing.component.sm};
  `,
  md: css`
    padding: ${({ theme }) => theme.semanticSpacing.component.md};
  `,
  lg: css`
    padding: ${({ theme }) => theme.semanticSpacing.component.lg};
  `,
  xl: css`
    padding: ${({ theme }) => theme.semanticSpacing.component.xl};
  `
}

// Border radius variants
const radiusStyles = {
  none: css`
    border-radius: ${({ theme }) => theme.borderRadius.none};
  `,
  sm: css`
    border-radius: ${({ theme }) => theme.semanticBorderRadius.card.small};
  `,
  md: css`
    border-radius: ${({ theme }) => theme.semanticBorderRadius.card.medium};
  `,
  lg: css`
    border-radius: ${({ theme }) => theme.semanticBorderRadius.card.large};
  `
}

// Game-specific variant styles
const gameVariantStyles = {
  player: css`
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.surface.primary} 0%, ${({ theme }) => theme.colors.surface.secondary} 100%);
    border: 2px solid ${({ theme }) => theme.colors.border.primary};
    box-shadow: ${({ theme }) => theme.semanticShadows.game.playerCard.default};
    
    &:hover {
      box-shadow: ${({ theme }) => theme.semanticShadows.game.playerCard.active};
      transform: translateY(-1px);
    }
  `,
  
  active: css`
    background-color: ${({ theme }) => theme.colors.surface.primary};
    border: 2px solid ${({ theme }) => theme.colors.primary[300]};
    box-shadow: ${({ theme }) => theme.semanticShadows.game.playerCard.active};
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary[500]}, ${({ theme }) => theme.colors.secondary[500]});
    }
  `,
  
  speaking: css`
    background-color: ${({ theme }) => theme.colors.surface.primary};
    border: 2px solid ${({ theme }) => theme.colors.game.speaking[300]};
    box-shadow: ${({ theme }) => theme.semanticShadows.game.playerCard.speaking};
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background-color: ${({ theme }) => theme.colors.game.speaking[500]};
    }
  `,
  
  voting: css`
    background-color: ${({ theme }) => theme.colors.surface.primary};
    border: 2px solid ${({ theme }) => theme.colors.game.voting[300]};
    box-shadow: ${({ theme }) => theme.semanticShadows.game.playerCard.voting};
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background-color: ${({ theme }) => theme.colors.game.voting[500]};
    }
  `,
  
  liar: css`
    background-color: ${({ theme }) => theme.colors.surface.primary};
    border: 2px solid ${({ theme }) => theme.colors.game.liar[300]};
    box-shadow: ${({ theme }) => theme.semanticShadows.game.playerCard.liar};
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background-color: ${({ theme }) => theme.colors.game.liar[500]};
    }
  `,
  
  citizen: css`
    background-color: ${({ theme }) => theme.colors.surface.primary};
    border: 2px solid ${({ theme }) => theme.colors.game.citizen[300]};
    box-shadow: ${({ theme }) => theme.semanticShadows.game.playerCard.citizen};
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background-color: ${({ theme }) => theme.colors.game.citizen[500]};
    }
  `
}

// Styled card with all variants
const StyledCard = styled(BaseCard)`
  ${({ $variant }) => variantStyles[$variant] || gameVariantStyles[$variant] || variantStyles.default}
  ${({ $padding }) => paddingStyles[$padding || 'md']}
  ${({ $radius }) => radiusStyles[$radius || 'md']}
`

// Card component
export const Card = forwardRef(({
  children,
  variant = 'default',
  padding = 'md',
  radius = 'md',
  onClick,
  className = '',
  style = {},
  as = 'div',
  ...props
}, ref) => {
  const isInteractive = variant === 'hoverable' || variant === 'interactive' || onClick

  return (
    <StyledCard
      ref={ref}
      as={as}
      onClick={onClick}
      className={className}
      style={style}
      $variant={variant}
      $padding={padding}
      $radius={radius}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      whileHover={isInteractive ? { scale: variant === 'interactive' ? 1.02 : 1 } : undefined}
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      onKeyDown={isInteractive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(e)
        }
      } : undefined}
      {...props}
    >
      {children}
    </StyledCard>
  )
})

Card.displayName = 'Card'

// Card sub-components for better composition
export const CardHeader = styled.div`
  padding-bottom: ${({ theme }) => theme.semanticSpacing.component.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  margin-bottom: ${({ theme }) => theme.semanticSpacing.component.md};
  
  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
    margin-bottom: 0;
  }
`

export const CardContent = styled.div`
  /* No default styles - purely semantic */
`

export const CardFooter = styled.div`
  padding-top: ${({ theme }) => theme.semanticSpacing.component.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border.primary};
  margin-top: ${({ theme }) => theme.semanticSpacing.component.md};
  
  &:first-child {
    padding-top: 0;
    border-top: none;
    margin-top: 0;
  }
`

export const CardTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.semanticSpacing.component.xs} 0;
  font-size: ${({ theme }) => theme.typography.h4.fontSize};
  font-weight: ${({ theme }) => theme.typography.h4.fontWeight};
  line-height: ${({ theme }) => theme.typography.h4.lineHeight};
  color: ${({ theme }) => theme.colors.text.primary};
`

export const CardDescription = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.bodySmall.fontSize};
  font-weight: ${({ theme }) => theme.typography.bodySmall.fontWeight};
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight};
  color: ${({ theme }) => theme.colors.text.secondary};
`

export default Card