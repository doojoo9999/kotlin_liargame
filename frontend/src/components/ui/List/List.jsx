import React from 'react'
import styled from 'styled-components'

// List Container
const StyledList = styled.ul`
  list-style: none;
  margin: 0;
  padding: ${props => props.$dense ? '4px 0' : '8px 0'};
  position: relative;
  background-color: ${props => props.theme.colors?.background?.paper || '#ffffff'};
`

// List Item
const StyledListItem = styled.li`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  position: relative;
  text-decoration: none;
  width: 100%;
  box-sizing: border-box;
  text-align: left;
  padding: ${props => {
    if (props.$dense) return '4px 16px';
    return '8px 16px';
  }};
  min-height: ${props => props.$dense ? '32px' : '48px'};
  cursor: ${props => props.$button ? 'pointer' : 'default'};
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  
  &:hover {
    ${props => props.$button && `
      background-color: ${props.theme.colors?.action?.hover || 'rgba(0, 0, 0, 0.04)'};
    `}
  }
  
  &:focus-visible {
    background-color: ${props => props.theme.colors?.action?.focus || 'rgba(0, 0, 0, 0.12)'};
    outline: none;
  }
  
  &[aria-selected="true"] {
    background-color: ${props => props.theme.colors?.action?.selected || 'rgba(25, 118, 210, 0.12)'};
  }
  
  ${props => props.$divider && `
    border-bottom: 1px solid ${props.theme.colors?.divider || 'rgba(0, 0, 0, 0.12)'};
  `}
`

// List Item Icon
const StyledListItemIcon = styled.div`
  min-width: ${props => props.$minWidth || '56px'};
  color: ${props => props.theme.colors?.action?.active || 'rgba(0, 0, 0, 0.54)'};
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
`

// List Item Text
const StyledListItemText = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  margin-top: ${props => props.$dense ? '0' : '4px'};
  margin-bottom: ${props => props.$dense ? '0' : '4px'};
`

const StyledPrimary = styled.div`
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.5;
  letter-spacing: 0.00938em;
  color: ${props => props.theme.colors?.text?.primary || 'rgba(0, 0, 0, 0.87)'};
  display: block;
  ${props => props.$noWrap && `
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `}
`

const StyledSecondary = styled.div`
  font-weight: 400;
  font-size: 0.875rem;
  line-height: 1.43;
  letter-spacing: 0.01071em;
  color: ${props => props.theme.colors?.text?.secondary || 'rgba(0, 0, 0, 0.6)'};
  display: block;
  ${props => props.$noWrap && `
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `}
`

// List Component
export const List = React.forwardRef(({
  children,
  dense = false,
  disablePadding = false,
  component = 'ul',
  className,
  sx,
  ...props
}, ref) => {
  return (
    <StyledList
      as={component}
      ref={ref}
      $dense={dense}
      className={className}
      style={sx}
      {...props}
    >
      {children}
    </StyledList>
  )
})

// ListItem Component
export const ListItem = React.forwardRef(({
  children,
  button = false,
  dense = false,
  divider = false,
  selected = false,
  component,
  onClick,
  className,
  sx,
  ...props
}, ref) => {
  const Component = component || (button ? 'button' : 'li')
  
  return (
    <StyledListItem
      as={Component}
      ref={ref}
      $button={button}
      $dense={dense}
      $divider={divider}
      aria-selected={selected ? 'true' : undefined}
      onClick={onClick}
      className={className}
      style={sx}
      tabIndex={button ? 0 : undefined}
      role={button ? 'button' : undefined}
      {...props}
    >
      {children}
    </StyledListItem>
  )
})

// ListItemIcon Component
export const ListItemIcon = React.forwardRef(({
  children,
  className,
  sx,
  ...props
}, ref) => {
  return (
    <StyledListItemIcon
      ref={ref}
      className={className}
      style={sx}
      {...props}
    >
      {children}
    </StyledListItemIcon>
  )
})

// ListItemText Component
export const ListItemText = React.forwardRef(({
  primary,
  secondary,
  children,
  dense = false,
  primaryTypographyProps,
  secondaryTypographyProps,
  className,
  sx,
  ...props
}, ref) => {
  return (
    <StyledListItemText
      ref={ref}
      $dense={dense}
      className={className}
      style={sx}
      {...props}
    >
      {primary && (
        <StyledPrimary 
          $noWrap={primaryTypographyProps?.noWrap}
          {...primaryTypographyProps}
        >
          {primary}
        </StyledPrimary>
      )}
      {secondary && (
        <StyledSecondary 
          $noWrap={secondaryTypographyProps?.noWrap}
          {...secondaryTypographyProps}
        >
          {secondary}
        </StyledSecondary>
      )}
      {children}
    </StyledListItemText>
  )
})

// Set display names
List.displayName = 'List'
ListItem.displayName = 'ListItem'
ListItemIcon.displayName = 'ListItemIcon'
ListItemText.displayName = 'ListItemText'