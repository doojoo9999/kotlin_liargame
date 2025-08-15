import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const StyledChip = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  border-radius: 16px;
  padding: 0 12px;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.43;
  letter-spacing: 0.01071em;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  
  background-color: ${props => {
    if (props.$variant === 'outlined') return 'transparent';
    switch (props.$color) {
      case 'primary': return props.theme.colors?.primary || '#1976d2';
      case 'secondary': return props.theme.colors?.secondary || '#dc004e';
      case 'error': return props.theme.colors?.error || '#f44336';
      case 'warning': return props.theme.colors?.warning || '#ff9800';
      case 'success': return props.theme.colors?.success || '#4caf50';
      case 'info': return props.theme.colors?.info || '#2196f3';
      default: return props.theme.colors?.grey?.[300] || '#e0e0e0';
    }
  }};
  
  color: ${props => {
    if (props.$variant === 'outlined') {
      switch (props.$color) {
        case 'primary': return props.theme.colors?.primary || '#1976d2';
        case 'secondary': return props.theme.colors?.secondary || '#dc004e';
        case 'error': return props.theme.colors?.error || '#f44336';
        case 'warning': return props.theme.colors?.warning || '#ff9800';
        case 'success': return props.theme.colors?.success || '#4caf50';
        case 'info': return props.theme.colors?.info || '#2196f3';
        default: return props.theme.colors?.text?.primary || 'rgba(0, 0, 0, 0.87)';
      }
    }
    
    // For filled variant
    switch (props.$color) {
      case 'primary':
      case 'secondary':
      case 'error':
      case 'warning':
      case 'success':
      case 'info':
        return '#ffffff';
      default: 
        return props.theme.colors?.text?.primary || 'rgba(0, 0, 0, 0.87)';
    }
  }};
  
  border: ${props => {
    if (props.$variant === 'outlined') {
      switch (props.$color) {
        case 'primary': return `1px solid ${props.theme.colors?.primary || '#1976d2'}`;
        case 'secondary': return `1px solid ${props.theme.colors?.secondary || '#dc004e'}`;
        case 'error': return `1px solid ${props.theme.colors?.error || '#f44336'}`;
        case 'warning': return `1px solid ${props.theme.colors?.warning || '#ff9800'}`;
        case 'success': return `1px solid ${props.theme.colors?.success || '#4caf50'}`;
        case 'info': return `1px solid ${props.theme.colors?.info || '#2196f3'}`;
        default: return `1px solid ${props.theme.colors?.grey?.[400] || '#bdbdbd'}`;
      }
    }
    return 'none';
  }};

  &:hover {
    ${props => props.$clickable && `
      background-color: ${props.$variant === 'outlined' ? 
        (props.theme.colors?.action?.hover || 'rgba(0, 0, 0, 0.04)') : 
        'rgba(0, 0, 0, 0.08)'
      };
    `}
  }

  &:focus-visible {
    outline: 2px solid ${props => props.theme.colors?.primary || '#1976d2'};
    outline-offset: 2px;
  }
`

const StyledLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: ${props => props.$avatar ? '0' : 'inherit'};
  padding-right: ${props => props.$deleteIcon ? '0' : 'inherit'};
`

const StyledIcon = styled.span`
  display: flex;
  align-items: center;
  margin-left: ${props => props.$position === 'start' ? '-6px' : '5px'};
  margin-right: ${props => props.$position === 'start' ? '5px' : '-6px'};
  color: ${props => props.$color || 'inherit'};
  font-size: 18px;
`

export const Chip = React.forwardRef(({
  label,
  variant = 'filled',
  color = 'default',
  size = 'medium',
  clickable = false,
  deletable = false,
  avatar,
  icon,
  deleteIcon,
  onDelete,
  onClick,
  className,
  sx,
  ...props
}, ref) => {
  const handleClick = (event) => {
    if (clickable && onClick) {
      onClick(event)
    }
  }

  const handleDelete = (event) => {
    event.stopPropagation()
    if (onDelete) {
      onDelete(event)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (deletable && onDelete) {
        event.preventDefault()
        onDelete(event)
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (clickable && onClick) {
        event.preventDefault()
        onClick(event)
      }
    }
  }

  return (
    <StyledChip
      ref={ref}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable || deletable ? 0 : undefined}
      $variant={variant}
      $color={color}
      $size={size}
      $clickable={clickable}
      className={className}
      style={sx}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {(avatar || icon) && (
        <StyledIcon $position="start" $color={color}>
          {avatar || icon}
        </StyledIcon>
      )}
      
      <StyledLabel $avatar={!!avatar} $deleteIcon={!!deleteIcon}>
        {label}
      </StyledLabel>
      
      {(deletable || deleteIcon) && (
        <StyledIcon 
          $position="end" 
          $color={color}
          onClick={handleDelete}
          role="button"
          tabIndex={-1}
        >
          {deleteIcon || '×'}
        </StyledIcon>
      )}
    </StyledChip>
  )
})

Chip.displayName = 'Chip'

Chip.propTypes = {
  label: PropTypes.node,
  variant: PropTypes.oneOf(['filled', 'outlined']),
  color: PropTypes.oneOf(['default', 'primary', 'secondary', 'error', 'info', 'success', 'warning']),
  size: PropTypes.oneOf(['small', 'medium']),
  clickable: PropTypes.bool,
  deletable: PropTypes.bool,
  avatar: PropTypes.node,
  icon: PropTypes.node,
  deleteIcon: PropTypes.node,
  onDelete: PropTypes.func,
  onClick: PropTypes.func,
  className: PropTypes.string,
  sx: PropTypes.object
}