import React from 'react'
import { Modal as MantineModal } from '@mantine/core'

// Dialog component
export const Dialog = ({ 
	children, 
	variant = 'default',
	size = 'md',
	className = '',
	...props 
}) => {
	return (
		<MantineModal className={className} size={size} {...props}>
			{children}
		</MantineModal>
	)
}

// Dialog sub-components
export const DialogTitle = ({ children, className, ...props }) => (
	<MantineModal.Title className={className} {...props}>
		{children}
	</MantineModal.Title>
)

export const DialogContent = ({ children, className, ...props }) => (
	<MantineModal.Body className={className} {...props}>
		{children}
	</MantineModal.Body>
)

export const DialogActions = ({ children, className, ...props }) => (
	<div className={className} {...props}>
		{children}
	</div>
)

export const DialogContentText = ({ children, className, ...props }) => (
	<div className={className} {...props}>
		{children}
	</div>
)

Dialog.displayName = 'Dialog'

export default Dialog