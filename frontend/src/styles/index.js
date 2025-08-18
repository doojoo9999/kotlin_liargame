// Minimal design tokens bridged to Mantine CSS variables
export const colors = {
	primary: { main: 'var(--mantine-color-blue-6)' },
	secondary: { main: 'var(--mantine-color-gray-6)' },
	success: { main: 'var(--mantine-color-green-6)' },
	error: { main: 'var(--mantine-color-red-6)', light: 'var(--mantine-color-red-3)' },
	warning: { main: 'var(--mantine-color-yellow-6)', light: 'var(--mantine-color-yellow-3)' },
	grey: { 300: 'var(--mantine-color-gray-3)', 400: 'var(--mantine-color-gray-4)' }
}

export const borderRadius = {
	full: '9999px',
	small: '6px'
}

export const animations = {
	transition: {
		default: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
		fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)'
	}
}

export const shadows = {
	small: '0 1px 2px rgba(0,0,0,0.15)',
	medium: '0 4px 10px rgba(0,0,0,0.15)',
	large: '0 10px 20px rgba(0,0,0,0.2)'
}

export const animationsTokens = animations

export const spacing = {
	xs: '4px',
	sm: '8px',
	md: '12px'
}

export default { colors, borderRadius, animations, shadows, spacing }
