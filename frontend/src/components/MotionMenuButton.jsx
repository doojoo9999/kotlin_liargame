import React from 'react';
import {motion} from 'framer-motion';
import {Button} from '@mantine/core';

/**
  * A reusable, animated menu button that combines Mantine's Button with Framer Motion.
  * It provides a consistent and dynamic UI element for the main menu.
  * @param {object} props - The component props.
  * @param {React.ReactNode} props.children - The text content of the button.
  * @param {Function} props.onClick - The function to call when the button is clicked.
 * @param {React.ElementType} props.icon - The icon component to display.
  * @param {object} props.gradient - The gradient configuration for the button background.
  * @param {boolean} [props.fullWidth=true] - Whether the button should take up the full width.
  * @param {'large' | 'medium'} [props.size='large'] - The size of the button.
  */
 export const MotionMenuButton = ({ children, onClick, icon: Icon, gradient, fullWidth = false, size = 'large' }) => {
  const sizeStyles = {
    large: {
      height: '60px',
      fontSize: '1.2rem',
      padding: '0 2rem',
      borderRadius: '12px',
      iconSize: 24,
    },
    medium: {
      height: '42px',
      fontSize: '0.9rem',
      padding: '0 1.25rem',
      borderRadius: '10px',
      iconSize: 18,
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.large;

  const buttonStyles = {
    height: currentSize.height,
    fontSize: currentSize.fontSize,
    padding: currentSize.padding,
    fontWeight: 'bold',
    textTransform: 'none',
    borderRadius: currentSize.borderRadius,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease-in-out',
    letterSpacing: '0.5px',
  };
 
   return (
     <motion.div
       whileHover={{ scale: 1.05, y: -2 }} // Subtle lift and scale on hover
       whileTap={{ scale: 0.98, y: 0 }}   // Satisfying press-down feedback
       transition={{ type: 'spring', stiffness: 300, damping: 20 }}
       style={{ width: fullWidth ? '100%' : 'auto' }}
     >
       <Button
         onClick={onClick}
         fullWidth
         variant="gradient"
         gradient={gradient}
         style={buttonStyles}
         leftSection={Icon ? <Icon size={currentSize.iconSize} stroke={1.5} /> : null}
       >
         {children}
       </Button>
     </motion.div>
   );
 };