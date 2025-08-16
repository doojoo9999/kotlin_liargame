import React from 'react'
import styled from 'styled-components'

const StyledBox = styled.div`
  ${({ $display }) => $display && `display: ${$display};`}
  ${({ $flexDirection }) => $flexDirection && `flex-direction: ${$flexDirection};`}
  ${({ $alignItems }) => $alignItems && `align-items: ${$alignItems};`}
  ${({ $justifyContent }) => $justifyContent && `justify-content: ${$justifyContent};`}
  ${({ $gap }) => $gap && `gap: ${$gap};`}
  ${({ $padding }) => $padding && `padding: ${$padding};`}
  ${({ $margin }) => $margin && `margin: ${$margin};`}
  ${({ $width }) => $width && `width: ${$width};`}
  ${({ $height }) => $height && `height: ${$height};`}
  ${({ $maxWidth }) => $maxWidth && `max-width: ${$maxWidth};`}
`

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

  return (
    <StyledBox
      as={component}
      ref={ref} 
      style={style}
      $display={$display}
      $flexDirection={$flexDirection}
      $alignItems={$alignItems}
      $justifyContent={$justifyContent}
      $gap={$gap}
      $padding={$padding}
      $margin={$margin}
      $width={$width}
      $height={$height}
      $maxWidth={$maxWidth || maxWidth} // transient prop conversion
      {...otherProps} // maxWidth is already removed
    >
      {children}
    </StyledBox>
  )
})

Box.displayName = 'Box'
export default Box