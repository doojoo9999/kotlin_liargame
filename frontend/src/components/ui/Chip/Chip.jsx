import React from 'react'
import { Chip as MantineChip } from '@mantine/core'

// Chip component
export const Chip = ({ 
	children, 
	variant = 'default',
	size = 'md',
	color,
	className = '',
	...props 
}) => {
	// Map variant to color
	const getVariantColor = () => {
		if (color) return color
		switch (variant) {
			case 'victory':
				return 'green'
			case 'defeat':
				return 'red'
			case 'role':
				return 'blue'
			case 'game':
				return 'gray'
			default:
				return 'blue'
		}
	}

	return (
		<MantineChip
			className={className}
			size={size}
			color={getVariantColor()}
			variant="filled"
			{...props}
		>
			{children}
		</MantineChip>
	)
}

Chip.displayName = 'Chip'

export default Chip