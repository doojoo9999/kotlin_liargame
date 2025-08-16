import React from 'react'
import styled from 'styled-components'

const StyledDivider = styled.hr`
  margin: 0;
  flex-shrink: 0;
  border-width: 0;
  border-style: solid;
  border-color: ${props => props.theme.colors?.divider || 'rgba(0, 0, 0, 0.12)'};
  
  ${props => {
    if (props.$orientation === 'vertical') {
      return `
        border-right-width: thin;
        height: 100%;
        width: 0;
        ${props.$flexItem ? 'align-self: stretch;' : ''}
      `;
    } else {
      return `
        border-bottom-width: thin;
        width: 100%;
        height: 0;
      `;
    }
  }}
  
  ${props => props.$variant === 'fullWidth' && `
    width: 100%;
  `}
  
  ${props => props.$variant === 'inset' && `
    margin-left: 72px;
  `}
  
  ${props => props.$variant === 'middle' && `
    margin-left: 16px;
    margin-right: 16px;
  `}
  
  ${props => props.$light && `
    border-color: ${props.theme.colors?.divider || 'rgba(0, 0, 0, 0.08)'};
  `}
  
  ${props => props.$absolute && `
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
  `}
`

const StyledDividerWithChildren = styled.div`
  display: flex;
  white-space: nowrap;
  text-align: center;
  border: 0;
  margin: 0;
  
  &::before,
  &::after {
    position: relative;
    width: 100%;
    border-top: thin solid ${props => props.theme.colors?.divider || 'rgba(0, 0, 0, 0.12)'};
    top: 50%;
    content: "";
    transform: translateY(50%);
  }
`

const StyledDividerContent = styled.span`
  display: inline-block;
  padding-left: 16px;
  padding-right: 16px;
  font-size: 0.875rem;
  color: ${props => props.theme.colors?.text?.secondary || 'rgba(0, 0, 0, 0.6)'};
`

export const Divider = React.forwardRef(({
  children,
  orientation = 'horizontal',
  variant = 'fullWidth',
  flexItem = false,
  light = false,
  absolute = false,
  textAlign = 'center',
  component = 'hr',
  className,
  sx,
  ...props
}, ref) => {
  // If children are provided, render as text divider
  if (children) {
    return (
      <StyledDividerWithChildren
        ref={ref}
        role="separator"
        className={className}
        style={sx}
        {...props}
      >
        <StyledDividerContent>
          {children}
        </StyledDividerContent>
      </StyledDividerWithChildren>
    )
  }

  return (
    <StyledDivider
      as={component}
      ref={ref}
      role="separator"
      $orientation={orientation}
      $variant={variant}
      $flexItem={flexItem}
      $light={light}
      $absolute={absolute}
      className={className}
      style={sx}
      {...props}
    />
  )
})

Divider.displayName = 'Divider'