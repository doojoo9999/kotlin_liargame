import React from 'react'

const Box = React.forwardRef((props, ref) => {
  const { 
    children, 
    style,
    // styled-components transient props ($ prefix)
    $display,
    $flexDirection,
    $alignItems,
    $justifyContent,
    $gap,
    $padding,
    $margin,
    $width,
    $height,
    $maxWidth,
    // DOM props that should NOT be passed through
    maxWidth, // ← this prop is extracted to prevent DOM propagation
    component = 'div',
    ...otherProps  // ← now otherProps doesn't include maxWidth
  } = props

  const computedStyle = {
    ...style,
    ...($display && { display: $display }),
    ...($flexDirection && { flexDirection: $flexDirection }),
    ...($alignItems && { alignItems: $alignItems }),
    ...($justifyContent && { justifyContent: $justifyContent }),
    ...($gap && { gap: $gap }),
    ...($padding && { padding: $padding }),
    ...($margin && { margin: $margin }),
    ...($width && { width: $width }),
    ...($height && { height: $height }),
    ...(($maxWidth || maxWidth) && { maxWidth: $maxWidth || maxWidth })
  }

  return (
    <div
      ref={ref} 
      style={computedStyle}
      {...otherProps}
    >
      {children}
    </div>
  )
})

Box.displayName = 'Box'
export default Box