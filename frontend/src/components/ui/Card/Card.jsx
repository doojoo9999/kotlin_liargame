import React, { forwardRef } from 'react'
import { Card as MantineCard, createStyles } from '@mantine/core'
import { motion } from 'framer-motion'

const useStyles = createStyles((theme, { variant, padding, radius, interactive }) => ({
  card: {
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
    
    // Interactive variants
    ...(interactive && {
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows.lg,
      },
      '&:active': {
        transform: 'translateY(-1px)',
        boxShadow: theme.shadows.md,
      },
      '&:focus-visible': {
        outline: `2px solid ${theme.colors.blue[6]}`,
        outlineOffset: '2px',
      },
    }),
  },

  // Game-specific variants
  game: {
    background: `linear-gradient(135deg, ${theme.colors.gray[0]}, ${theme.colors.gray[1]})`,
    border: `2px solid ${theme.colors.gray[3]}`,
    '&:hover': {
      borderColor: theme.colors.blue[4],
      background: `linear-gradient(135deg, ${theme.colors.blue[0]}, ${theme.colors.blue[1]})`,
    },
  },

  victory: {
    background: `linear-gradient(135deg, ${theme.colors.yellow[0]}, ${theme.colors.orange[1]})`,
    border: `2px solid ${theme.colors.yellow[4]}`,
    '&:hover': {
      borderColor: theme.colors.orange[5],
      background: `linear-gradient(135deg, ${theme.colors.orange[0]}, ${theme.colors.red[1]})`,
    },
  },

  defeat: {
    background: `linear-gradient(135deg, ${theme.colors.red[0]}, ${theme.colors.pink[1]})`,
    border: `2px solid ${theme.colors.red[4]}`,
    '&:hover': {
      borderColor: theme.colors.red[5],
      background: `linear-gradient(135deg, ${theme.colors.pink[0]}, ${theme.colors.red[1]})`,
    },
  },
}))

// Card component
export const Card = forwardRef(({
  children,
  variant = 'default',
  padding = 'md',
  radius = 'md',
  interactive = false,
  className = '',
  style = {},
  onClick,
  ...props
}, ref) => {
  const { classes, cx } = useStyles({ variant, padding, radius, interactive })

  const handleClick = (e) => {
    if (interactive && onClick) {
      onClick(e)
    }
  }

  return (
    <motion.div
      whileHover={interactive ? { scale: 1.02 } : {}}
      whileTap={interactive ? { scale: 0.98 } : {}}
      className={classes.card}
    >
      <MantineCard
        ref={ref}
        className={cx(className, classes.card)}
        style={style}
        padding={padding}
        radius={radius}
        withBorder
        shadow="sm"
        onClick={handleClick}
        {...props}
      >
        {children}
      </MantineCard>
    </motion.div>
  )
})

Card.displayName = 'Card'

// Card sub-components
export const CardHeader = ({ children, className, ...props }) => (
  <MantineCard.Section className={className} {...props}>
    {children}
  </MantineCard.Section>
)

export const CardContent = ({ children, className, ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
)

export const CardFooter = ({ children, className, ...props }) => (
  <MantineCard.Section className={className} {...props}>
    {children}
  </MantineCard.Section>
)

export const CardTitle = ({ children, className, ...props }) => (
  <MantineCard.Section className={className} {...props}>
    {children}
  </MantineCard.Section>
)

export const CardDescription = ({ children, className, ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
)

export default Card