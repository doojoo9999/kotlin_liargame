import React from 'react'
import { Table as MantineTable, createStyles } from '@mantine/core'

const useStyles = createStyles((theme, { variant, size, striped, hoverable }) => ({
  table: {
    transition: 'all 0.2s ease',
    
    // Striped rows
    ...(striped && {
      '& tbody tr:nth-of-type(odd)': {
        backgroundColor: theme.colors.gray[0],
      },
    }),
    
    // Hoverable rows
    ...(hoverable && {
      '& tbody tr:hover': {
        backgroundColor: theme.colors.blue[0],
        cursor: 'pointer',
      },
    }),
  },

  // Game-specific variants
  game: {
    background: `linear-gradient(135deg, ${theme.colors.gray[0]}, ${theme.colors.gray[1]})`,
    border: `2px solid ${theme.colors.gray[3]}`,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },

  players: {
    '& thead th': {
      background: `linear-gradient(135deg, ${theme.colors.blue[6]}, ${theme.colors.blue[7]})`,
      color: theme.white,
      fontWeight: 600,
    },
    '& tbody tr': {
      borderBottom: `1px solid ${theme.colors.gray[3]}`,
      '&:hover': {
        background: theme.colors.blue[0],
      },
    },
  },

  rooms: {
    '& thead th': {
      background: `linear-gradient(135deg, ${theme.colors.green[6]}, ${theme.colors.green[7]})`,
      color: theme.white,
      fontWeight: 600,
    },
    '& tbody tr': {
      borderBottom: `1px solid ${theme.colors.gray[3]}`,
      '&:hover': {
        background: theme.colors.green[0],
      },
    },
  },
}))

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
  const { classes, cx } = useStyles({ variant, size, striped, hoverable })

  return (
    <MantineTable
      className={cx(className, classes.table)}
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

Table.displayName = 'Table'

export default Table