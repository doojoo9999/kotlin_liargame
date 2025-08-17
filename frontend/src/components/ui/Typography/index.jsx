import React from 'react'
import PropTypes from 'prop-types'
import {Text as MantineText, Title as MantineTitle} from '@mantine/core'

// Simple MUI-like Typography wrapper on top of Mantine
export const Typography = ({
  variant = 'body1',
  component,
  color,
  align,
  gutterBottom,
  sx,
  style,
  children,
  ...rest
}) => {
  const isHeading = /^h[1-6]$/.test(variant)

  const mergedStyle = {
    ...(align ? { textAlign: align } : null),
    ...(color ? { color } : null),
    ...(gutterBottom ? { marginBottom: '0.35em' } : null),
    ...style,
    ...(sx || {}),
  }

  if (isHeading) {
    const order = parseInt(variant.substring(1), 10)
    return (
      <MantineTitle order={order} c={color} component={component} style={mergedStyle} {...rest}>
        {children}
      </MantineTitle>
    )
  }

  // Map common MUI variants to Mantine sizes/weights
  const variantMap = {
    subtitle1: { size: 'lg', fw: 500 },
    subtitle2: { size: 'md', fw: 500 },
    body1: { size: 'md' },
    body2: { size: 'sm' },
    caption: { size: 'xs' },
    overline: { size: 'xs', tt: 'uppercase', ls: 1 },
  }
  const map = variantMap[variant] || { size: 'md' }

  return (
    <MantineText
      size={map.size}
      fw={map.fw}
      tt={map.tt}
      lts={map.ls}
      c={color}
      component={component}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </MantineText>
  )
}

// Preserve direct Text/Title exports for places that already use them
export const Text = MantineText
export const Title = MantineTitle

Typography.propTypes = {
  variant: PropTypes.string,
  component: PropTypes.any,
  color: PropTypes.string,
  align: PropTypes.oneOf(['inherit','left','center','right','justify']),
  gutterBottom: PropTypes.bool,
  sx: PropTypes.object,
  style: PropTypes.object,
  children: PropTypes.node,
}