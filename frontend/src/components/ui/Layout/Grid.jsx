import React from 'react'

const Grid = React.forwardRef((props, ref) => {
  const { 
    children, 
    style,
    $columns,
    $rows,
    $gap,
    $columnGap,
    $rowGap,
    $padding,
    $margin,
    ...otherProps 
  } = props

  const computedStyle = {
    display: 'grid',
    ...style,
    ...($columns && { gridTemplateColumns: $columns }),
    ...($rows && { gridTemplateRows: $rows }),
    ...($gap && { gap: $gap }),
    ...($columnGap && { columnGap: $columnGap }),
    ...($rowGap && { rowGap: $rowGap }),
    ...($padding && { padding: $padding }),
    ...($margin && { margin: $margin })
  }

  return (
    <div ref={ref} style={computedStyle} {...otherProps}>
      {children}
    </div>
  )
})

Grid.displayName = 'Grid'
export default Grid