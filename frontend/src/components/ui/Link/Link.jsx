import React from 'react'
import styled from 'styled-components'
import {Link as RouterLink} from 'react-router-dom'

const StyledLink = styled.a`
  color: ${props => props.theme.colors?.primary?.main || '#1976d2'};
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease-in-out;
  
  &:hover {
    color: ${props => props.theme.colors?.primary?.dark || '#1565c0'};
    text-decoration: underline;
  }
  
  &:focus {
    outline: 2px solid ${props => props.theme.colors?.primary?.main || '#1976d2'};
    outline-offset: 2px;
  }
`

const StyledButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors?.primary?.main || '#1976d2'};
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease-in-out;
  font: inherit;
  padding: 0;
  margin: 0;
  
  &:hover {
    color: ${props => props.theme.colors?.primary?.dark || '#1565c0'};
    text-decoration: underline;
  }
  
  &:focus {
    outline: 2px solid ${props => props.theme.colors?.primary?.main || '#1976d2'};
    outline-offset: 2px;
  }
`

export const Link = React.forwardRef(({
  component,
  to,
  href,
  children,
  onClick,
  style,
  ...props
}, ref) => {
  // If component is RouterLink or has 'to' prop, use RouterLink
  if (component === RouterLink || to) {
    return (
      <StyledLink
        as={RouterLink}
        to={to}
        ref={ref}
        onClick={onClick}
        style={style}
        {...props}
      >
        {children}
      </StyledLink>
    )
  }
  
  // If component is button or has onClick without href, use button
  if (component === 'button' || (onClick && !href)) {
    return (
      <StyledButton
        ref={ref}
        onClick={onClick}
        style={style}
        {...props}
      >
        {children}
      </StyledButton>
    )
  }
  
  // Default to anchor tag
  return (
    <StyledLink
      ref={ref}
      href={href}
      onClick={onClick}
      style={style}
      {...props}
    >
      {children}
    </StyledLink>
  )
})

Link.displayName = 'Link'