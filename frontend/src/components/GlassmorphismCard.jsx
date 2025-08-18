import React from 'react';
import {motion} from 'framer-motion';
import {Paper} from '@mantine/core';

const MotionPaper = motion.create(Paper);

export function GlassmorphismCard({ children, ...props }) {
  return (
    <MotionPaper
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.8,
        ease: 'easeOut',
        type: 'spring',
        stiffness: 100,
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      shadow="xl"
      p="xl"
      radius="xl"
      bg="rgba(255, 255, 255, 0.15)"
      style={{
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        position: 'relative',
        ...props.style,
      }}
      {...props}
    >
      {/* Content wrapper */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </MotionPaper>
  );
}