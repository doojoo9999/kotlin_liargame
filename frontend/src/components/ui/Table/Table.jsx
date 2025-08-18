import React from 'react'
import { Table as MantineTable } from '@mantine/core'

// Table component
export const Table = ({ 
  children, 
  variant = 'default',
  size = 'md',
  striped = false,
  hoverable = false,
  className = '',
  ...props 
}) => {
  return (
    <MantineTable
      className={className}
      size={size}
      striped={striped}
      highlightOnHover={hoverable}
      {...props}
    >
      {children}
    </MantineTable>
  )
}

// Table sub-components
export const TableHead = ({ children, className, ...props }) => (
  <MantineTable.Thead className={className} {...props}>
    {children}
  </MantineTable.Thead>
)

export const TableBody = ({ children, className, ...props }) => (
  <MantineTable.Tbody className={className} {...props}>
    {children}
  </MantineTable.Tbody>
)

export const TableRow = ({ children, className, ...props }) => (
  <MantineTable.Tr className={className} {...props}>
    {children}
  </MantineTable.Tr>
)

export const TableCell = ({ children, className, ...props }) => (
  <MantineTable.Td className={className} {...props}>
    {children}
  </MantineTable.Td>
)

export const TableHeader = ({ children, className, ...props }) => (
  <MantineTable.Th className={className} {...props}>
    {children}
  </MantineTable.Th>
)

// Simple container wrapper to keep API compatibility
export const TableContainer = ({ children, className = '', style = {}, ...props }) => (
  <div className={className} style={{ width: '100%', overflowX: 'auto', ...style }} {...props}>
    {children}
  </div>
)

Table.displayName = 'Table'

export default Table