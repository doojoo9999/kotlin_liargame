import React from 'react'
import { Divider as MantineDivider } from '@mantine/core'

// Divider component
export const Divider = ({ 
	children, 
	variant = 'default',
	size = 'md',
	color,
	orientation = 'horizontal',
	className = '',
	...props 
}) => {
	// Map size to Mantine size
	const getMantineSize = () => {
		switch (size) {
			case 'thin':
				return 'xs'
			case 'thick':
				return 'lg'
			default:
				return 'md'
		}
	}

	// Map variant to color
	const getVariantColor = () => {
		if (color) return color
		switch (variant) {
			case 'game':
				return 'blue'
			case 'section':
				return 'gray'
			case 'victory':
				return 'green'
			case 'defeat':
				return 'red'
			default:
				return 'gray'
		}
	}

	return (
		<MantineDivider
			className={className}
			size={getMantineSize()}
			color={getVariantColor()}
			orientation={orientation}
			{...props}
		>
			{children}
		</MantineDivider>
	)
}

Divider.displayName = 'Divider'

export default Divider