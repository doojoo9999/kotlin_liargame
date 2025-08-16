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
  */
 export const MotionMenuButton = ({ children, onClick, icon: Icon, gradient, fullWidth = true }) => {
   const buttonStyles = {
     height: '60px',
     fontSize: '1.2rem',
     fontWeight: 'bold',
     textTransform: 'none',
     borderRadius: '12px', // Softer corners for a modern look
     boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)', // Deeper shadow for a floating effect
     transition: 'all 0.3s ease-in-out',
     letterSpacing: '1px', // Increased letter spacing for clarity
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
         leftSection={Icon ? <Icon size={24} stroke={1.5} /> : null}
       >
         {children}
       </Button>
     </motion.div>
   );
 };