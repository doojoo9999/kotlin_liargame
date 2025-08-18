import React, { forwardRef } from 'react'
import { Card as MantineCard } from '@mantine/core'
import { motion } from 'framer-motion'
import './Card.styles.css'

// Card component
export const Card = forwardRef(({ 
	children,
	variant = 'default',
	padding = 'md',
	radius = 'md',
	interactive = false,
	className = '',
	style = {},
	onClick,
	...props
}, ref) => {
	const handleClick = (e) => {
		if (interactive && onClick) {
			onClick(e)
		}
	}

	const classes = ['cardBase']
	if (interactive) classes.push('interactive')
	if (['game', 'victory', 'defeat'].includes(variant)) classes.push(`variant-${variant}`)

	return (
		<motion.div
			whileHover={interactive ? { scale: 1.02 } : {}}
			whileTap={interactive ? { scale: 0.98 } : {}}
			className={[...classes, className].filter(Boolean).join(' ')}
		>
			<MantineCard
				ref={ref}
				className={[...classes, className].filter(Boolean).join(' ')}
				style={style}
				padding={padding}
				radius={radius}
				withBorder
				shadow="sm"
				onClick={handleClick}
				{...props}
			>
				{children}
			</MantineCard>
		</motion.div>
	)
})

Card.displayName = 'Card'

// Card sub-components
export const CardHeader = ({ children, className, ...props }) => (
	<MantineCard.Section className={className} {...props}>
		{children}
	</MantineCard.Section>
)

export const CardContent = ({ children, className, ...props }) => (
	<div className={className} {...props}>
		{children}
	</div>
)

export const CardFooter = ({ children, className, ...props }) => (
	<MantineCard.Section className={className} {...props}>
		{children}
	</MantineCard.Section>
)

export const CardTitle = ({ children, className, ...props }) => (
	<MantineCard.Section className={className} {...props}>
		{children}
	</MantineCard.Section>
)

export const CardDescription = ({ children, className, ...props }) => (
	<div className={className} {...props}>
		{children}
	</div>
)

export default Card