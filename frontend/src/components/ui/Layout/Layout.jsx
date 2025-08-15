import styled, {css} from 'styled-components'
import {spacing} from '@/styles'

// Box component to replace MUI Box
const Box = styled.div`
  ${props => props.$display && css`
    display: ${props.$display};
  `}
  
  ${props => props.$flexDirection && css`
    flex-direction: ${props.$flexDirection};
  `}
  
  ${props => props.$justifyContent && css`
    justify-content: ${props.$justifyContent};
  `}
  
  ${props => props.$alignItems && css`
    align-items: ${props.$alignItems};
  `}
  
  ${props => props.$height && css`
    height: ${props.$height};
  `}
  
  ${props => props.$width && css`
    width: ${props.$width};
  `}
  
  ${props => props.$gap && css`
    gap: ${typeof props.$gap === 'number' ? `${props.$gap * 8}px` : props.$gap};
  `}
  
  ${props => props.$padding && css`
    padding: ${typeof props.$padding === 'number' ? `${props.$padding * 8}px` : props.$padding};
  `}
  
  ${props => props.$margin && css`
    margin: ${typeof props.$margin === 'number' ? `${props.$margin * 8}px` : props.$margin};
  `}
  
  ${props => props.$backgroundColor && css`
    background-color: ${props.$backgroundColor};
  `}
  
  ${props => props.$color && css`
    color: ${props.$color};
  `}
  
  ${props => props.$borderRadius && css`
    border-radius: ${typeof props.$borderRadius === 'number' ? `${props.$borderRadius}px` : props.$borderRadius};
  `}
  
  ${props => props.$boxShadow && css`
    box-shadow: ${props.$boxShadow};
  `}
  
  ${props => props.$position && css`
    position: ${props.$position};
  `}
  
  ${props => props.$top && css`
    top: ${props.$top};
  `}
  
  ${props => props.$left && css`
    left: ${props.$left};
  `}
  
  ${props => props.$right && css`
    right: ${props.$right};
  `}
  
  ${props => props.$bottom && css`
    bottom: ${props.$bottom};
  `}
  
  ${props => props.$zIndex && css`
    z-index: ${props.$zIndex};
  `}
  
  ${props => props.$overflow && css`
    overflow: ${props.$overflow};
  `}
  
  ${props => props.$textAlign && css`
    text-align: ${props.$textAlign};
  `}
`

// Container component
const Container = styled.div`
  width: 100%;
  max-width: ${props => {
    switch (props.$maxWidth) {
      case 'xs': return '444px'
      case 'sm': return '600px'
      case 'md': return '960px'
      case 'lg': return '1280px'
      case 'xl': return '1920px'
      default: return props.$maxWidth || '100%'
    }
  }};
  margin: 0 auto;
  padding: 0 ${spacing.md};
  
  ${props => props.$disableGutters && css`
    padding: 0;
  `}
`

// Stack component for vertical/horizontal layouts
const Stack = styled.div`
  display: flex;
  flex-direction: ${props => props.$direction || 'column'};
  gap: ${props => typeof props.$spacing === 'number' ? `${props.$spacing * 8}px` : props.$spacing || spacing.md};
  
  ${props => props.$alignItems && css`
    align-items: ${props.$alignItems};
  `}
  
  ${props => props.$justifyContent && css`
    justify-content: ${props.$justifyContent};
  `}
  
  ${props => props.$wrap && css`
    flex-wrap: wrap;
  `}
`

// Grid component
const Grid = styled.div`
  display: grid;
  gap: ${props => typeof props.$gap === 'number' ? `${props.$gap * 8}px` : props.$gap || spacing.md};
  
  ${props => props.$columns && css`
    grid-template-columns: ${typeof props.$columns === 'number' ? `repeat(${props.$columns}, 1fr)` : props.$columns};
  `}
  
  ${props => props.$rows && css`
    grid-template-rows: ${typeof props.$rows === 'number' ? `repeat(${props.$rows}, 1fr)` : props.$rows};
  `}
  
  ${props => props.$areas && css`
    grid-template-areas: ${props.$areas};
  `}
`

// Center component for easy centering
const Center = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${props => props.$height && css`
    height: ${props.$height};
  `}
  
  ${props => props.$width && css`
    width: ${props.$width};
  `}
`

// Spacer component
const Spacer = styled.div`
  ${props => props.$x && css`
    width: ${typeof props.$x === 'number' ? `${props.$x * 8}px` : props.$x};
  `}
  
  ${props => props.$y && css`
    height: ${typeof props.$y === 'number' ? `${props.$y * 8}px` : props.$y};
  `}
  
  ${props => !props.$x && !props.$y && css`
    flex: 1;
  `}
`

// Export all layout components
export {
  Box,
  Container,
  Stack,
  Grid,
  Center,
  Spacer
}