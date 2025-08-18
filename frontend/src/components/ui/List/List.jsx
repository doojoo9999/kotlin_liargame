import React from 'react'
import { List as MantineList } from '@mantine/core'

// List component
export const List = ({ 
  children, 
  variant = 'default',
  size = 'md',
  spacing = 'md',
  className = '',
  ...props 
}) => {
  return (
    <MantineList
      className={className}
      size={size}
      spacing={spacing}
      {...props}
    >
      {children}
    </MantineList>
  )
}

// List sub-components
export const ListItem = ({ children, className, ...props }) => (
  <MantineList.Item className={className} {...props}>
    {children}
  </MantineList.Item>
)

export const ListItemIcon = ({ children, className, ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
)

export const ListItemText = ({ children, className, ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
)

List.displayName = 'List'

export default List