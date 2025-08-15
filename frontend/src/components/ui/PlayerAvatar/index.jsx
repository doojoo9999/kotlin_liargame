// PlayerAvatar system barrel export
// Main entry point for all avatar-related components

// Main avatar component
export { default as PlayerAvatar } from './PlayerAvatar.jsx'

// Supporting components
export { default as AvatarStatusDot } from './AvatarStatusDot.jsx'
export { default as AvatarBadge } from './AvatarBadge.jsx'
export { 
  default as AvatarEffects,
  GlowEffect,
  ShakeEffect,
  BounceEffect,
  FadeInEffect,
  useRipple
} from './AvatarEffects.jsx'