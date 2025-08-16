import React from 'react'
import styled from 'styled-components'

const StyledGrid = styled.div`
  display: grid;
  ${({ $columns }) => $columns && `grid-template-columns: ${$columns};`}
  ${({ $rows }) => $rows && `grid-template-rows: ${$rows};`}
  ${({ $gap }) => $gap && `gap: ${$gap};`}
  ${({ $columnGap }) => $columnGap && `column-gap: ${$columnGap};`}
  ${({ $rowGap }) => $rowGap && `row-gap: ${$rowGap};`}
  ${({ $padding }) => $padding && `padding: ${$padding};`}
  ${({ $margin }) => $margin && `margin: ${$margin};`}
`

const Grid = React.forwardRef((props, ref) => {
  const { children, style, ...otherProps } = props
  return (
    <StyledGrid ref={ref} style={style} {...otherProps}>
      {children}
    </StyledGrid>
  )
})

Grid.displayName = 'Grid'
export default Grid