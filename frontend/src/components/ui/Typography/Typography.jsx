import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const StyledTypography = styled.div`
  margin: 0;
  font-family: ${props => props.theme.typography?.fontFamily || 'inherit'};
  font-weight: ${props => {
    switch (props.$variant) {
      case 'h1': return 700;
      case 'h2': return 600;
      case 'h3': return 600;
      case 'h4': return 600;
      case 'h5': return 600;
      case 'h6': return 600;
      case 'subtitle1': return 500;
      case 'subtitle2': return 500;
      case 'body1': return 400;
      case 'body2': return 400;
      case 'caption': return 400;
      case 'overline': return 400;
      default: return 400;
    }
  }};
  
  font-size: ${props => {
    switch (props.$variant) {
      case 'h1': return '2.125rem';
      case 'h2': return '1.5rem';
      case 'h3': return '1.25rem';
      case 'h4': return '1.125rem';
      case 'h5': return '1rem';
      case 'h6': return '0.875rem';
      case 'subtitle1': return '1rem';
      case 'subtitle2': return '0.875rem';
      case 'body1': return '1rem';
      case 'body2': return '0.875rem';
      case 'caption': return '0.75rem';
      case 'overline': return '0.625rem';
      default: return '1rem';
    }
  }};
  
  line-height: ${props => {
    switch (props.$variant) {
      case 'h1': return 1.235;
      case 'h2': return 1.334;
      case 'h3': return 1.6;
      case 'h4': return 1.5;
      case 'h5': return 1.334;
      case 'h6': return 1.6;
      case 'subtitle1': return 1.75;
      case 'subtitle2': return 1.57;
      case 'body1': return 1.5;
      case 'body2': return 1.43;
      case 'caption': return 1.66;
      case 'overline': return 2.66;
      default: return 1.5;
    }
  }};

  color: ${props => {
    if (props.$color === 'primary') return props.theme.colors?.primary || '#1976d2';
    if (props.$color === 'secondary') return props.theme.colors?.secondary || '#dc004e';
    if (props.$color === 'error') return props.theme.colors?.error || '#f44336';
    if (props.$color === 'warning') return props.theme.colors?.warning || '#ff9800';
    if (props.$color === 'success') return props.theme.colors?.success || '#4caf50';
    if (props.$color === 'info') return props.theme.colors?.info || '#2196f3';
    if (props.$color === 'textPrimary') return props.theme.colors?.text?.primary || 'rgba(0, 0, 0, 0.87)';
    if (props.$color === 'textSecondary') return props.theme.colors?.text?.secondary || 'rgba(0, 0, 0, 0.6)';
    return props.theme.colors?.text?.primary || 'rgba(0, 0, 0, 0.87)';
  }};

  text-align: ${props => props.$align || 'inherit'};
  text-transform: ${props => {
    if (props.$variant === 'overline') return 'uppercase';
    return props.$transform || 'none';
  }};
  
  letter-spacing: ${props => {
    if (props.$variant === 'overline') return '0.08333em';
    return 'normal';
  }};

  ${props => props.$gutterBottom && `margin-bottom: 0.35em;`}
  ${props => props.$noWrap && `
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `}
`

export const Typography = React.forwardRef(({
  variant = 'body1',
  color,
  align,
  gutterBottom = false,
  noWrap = false,
  component,
  children,
  className,
  sx,
  ...props
}, ref) => {
  const Component = component || (() => {
    switch (variant) {
      case 'h1': return 'h1';
      case 'h2': return 'h2';
      case 'h3': return 'h3';
      case 'h4': return 'h4';
      case 'h5': return 'h5';
      case 'h6': return 'h6';
      case 'subtitle1':
      case 'subtitle2':
      case 'body1':
      case 'body2':
        return 'p';
      case 'caption':
      case 'overline':
        return 'span';
      default:
        return 'p';
    }
  })();

  return (
    <StyledTypography
      as={Component}
      ref={ref}
      $variant={variant}
      $color={color}
      $align={align}
      $gutterBottom={gutterBottom}
      $noWrap={noWrap}
      className={className}
      style={sx}
      {...props}
    >
      {children}
    </StyledTypography>
  )
})

Typography.displayName = 'Typography'

Typography.propTypes = {
  variant: PropTypes.oneOf([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'subtitle1', 'subtitle2',
    'body1', 'body2',
    'caption', 'overline'
  ]),
  color: PropTypes.oneOf([
    'inherit', 'primary', 'secondary', 'textPrimary', 'textSecondary',
    'error', 'warning', 'info', 'success'
  ]),
  align: PropTypes.oneOf(['inherit', 'left', 'center', 'right', 'justify']),
  gutterBottom: PropTypes.bool,
  noWrap: PropTypes.bool,
  component: PropTypes.elementType,
  children: PropTypes.node,
  className: PropTypes.string,
  sx: PropTypes.object
}