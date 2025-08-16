import React from 'react'
import styled from 'styled-components'
import {borderRadius, colors, spacing} from '@/styles'

const StyledTableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: ${borderRadius.medium};
  border: 1px solid ${colors.border.primary};
`

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: ${colors.surface.primary};
`

const StyledTableHead = styled.thead`
  background-color: ${colors.surface.secondary};
`

const StyledTableBody = styled.tbody``

const StyledTableRow = styled.tr`
  &:nth-child(even) {
    background-color: ${colors.surface.secondary};
  }
  
  &:hover {
    background-color: ${colors.surface.hover || 'rgba(0, 0, 0, 0.04)'};
  }
`

const StyledTableCell = styled.td`
  padding: ${spacing.md};
  text-align: ${props => props.align || 'left'};
  vertical-align: middle;
  border-bottom: 1px solid ${colors.border.secondary};
  font-size: 14px;
  color: ${colors.text.primary};
  
  &:first-child {
    padding-left: ${spacing.lg};
  }
  
  &:last-child {
    padding-right: ${spacing.lg};
  }
`

const StyledTableHeaderCell = styled.th`
  padding: ${spacing.md};
  text-align: ${props => props.align || 'left'};
  vertical-align: middle;
  border-bottom: 2px solid ${colors.border.primary};
  font-size: 14px;
  font-weight: 600;
  color: ${colors.text.primary};
  background-color: ${colors.surface.secondary};
  
  &:first-child {
    padding-left: ${spacing.lg};
  }
  
  &:last-child {
    padding-right: ${spacing.lg};
  }
`

export const TableContainer = React.forwardRef(({ children, className, style, ...props }, ref) => (
  <StyledTableContainer ref={ref} className={className} style={style} {...props}>
    {children}
  </StyledTableContainer>
))

export const Table = React.forwardRef(({ children, className, style, ...props }, ref) => (
  <StyledTable ref={ref} className={className} style={style} {...props}>
    {children}
  </StyledTable>
))

export const TableHead = React.forwardRef(({ children, className, style, ...props }, ref) => (
  <StyledTableHead ref={ref} className={className} style={style} {...props}>
    {children}
  </StyledTableHead>
))

export const TableBody = React.forwardRef(({ children, className, style, ...props }, ref) => (
  <StyledTableBody ref={ref} className={className} style={style} {...props}>
    {children}
  </StyledTableBody>
))

export const TableRow = React.forwardRef(({ children, className, style, ...props }, ref) => (
  <StyledTableRow ref={ref} className={className} style={style} {...props}>
    {children}
  </StyledTableRow>
))

export const TableCell = React.forwardRef(({ 
  children, 
  align, 
  colSpan, 
  className, 
  style, 
  ...props 
}, ref) => (
  <StyledTableCell 
    ref={ref} 
    align={align} 
    colSpan={colSpan}
    className={className} 
    style={style} 
    {...props}
  >
    {children}
  </StyledTableCell>
))

// Header cell variant
export const TableHeaderCell = React.forwardRef(({ 
  children, 
  align, 
  className, 
  style, 
  ...props 
}, ref) => (
  <StyledTableHeaderCell 
    ref={ref} 
    align={align} 
    className={className} 
    style={style} 
    {...props}
  >
    {children}
  </StyledTableHeaderCell>
))

// Display names for debugging
TableContainer.displayName = 'TableContainer'
Table.displayName = 'Table'
TableHead.displayName = 'TableHead'
TableBody.displayName = 'TableBody'
TableRow.displayName = 'TableRow'
TableCell.displayName = 'TableCell'
TableHeaderCell.displayName = 'TableHeaderCell'