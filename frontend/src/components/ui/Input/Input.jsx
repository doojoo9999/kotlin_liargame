import React, { forwardRef } from 'react'
import { TextInput } from '@mantine/core'
import { motion } from 'framer-motion'

// Input component
export const Input = forwardRef(({ 
	children,
	variant = 'default',
	size = 'md',
	error,
	className = '',
	style = {},
	onFocus,
	onBlur,
	...props
}, ref) => {
	const [focused, setFocused] = React.useState(false)

	const handleFocus = (e) => {
		setFocused(true)
		onFocus?.(e)
	}

	const handleBlur = (e) => {
		setFocused(false)
		onBlur?.(e)
	}

	// Wrapper interaction styles
	const wrapperStyle = {
		transition: 'transform 0.2s ease, box-shadow 0.2s ease',
		transform: focused ? 'scale(1.02)' : undefined,
		boxShadow: focused ? 'var(--mantine-shadow-md)' : undefined,
	}

	// Map custom variants to TextInput props and style
	const variantProps = (() => {
		switch (variant) {
			case 'chat':
				return { radius: 'xl' }
			case 'game':
				return { variant: 'filled', radius: 'md' }
			default:
				return {}
		}
	})()

	return (
		<motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} style={wrapperStyle}>
			<TextInput
				ref={ref}
				className={className}
				style={style}
				size={size}
				error={error}
				onFocus={handleFocus}
				onBlur={handleBlur}
				{...variantProps}
				{...props}
			>
				{children}
			</TextInput>
		</motion.div>
	)
})

Input.displayName = 'Input'

export default Input