# Liar Game UI/UX Design System

## Overview
This document outlines the comprehensive design system implemented for the Liar Game, focusing on the moderator commentary system, game phase components, and user interaction patterns.

## Core Design Principles

### 1. **User-Centered Design**
- **Accessibility First**: All components support keyboard navigation and screen readers
- **Progressive Disclosure**: Complex information is revealed gradually based on user needs
- **Responsive Design**: Mobile-first approach with breakpoints at 768px, 1024px, and 1280px
- **Inclusive Design**: Color combinations meet WCAG AA contrast requirements

### 2. **Visual Hierarchy**
- **Moderator Commentary**: Most prominent element using bright colors and animations
- **Game Actions**: Secondary prominence with clear call-to-action styling  
- **Player Status**: Supporting information with consistent status indicators
- **Activity Feed**: Background information with subtle styling

### 3. **Consistent Patterns**
- **Color System**: Based on Tailwind's semantic color palette
- **Typography**: Clear font size hierarchy (text-xs to text-2xl)
- **Spacing**: Consistent 4px grid system
- **Icons**: Lucide React icons for consistency

## Component Architecture

### 1. **ModeratorCommentary Component**

**Purpose**: Prominent, eye-catching moderator guidance system

**Key Features**:
- **Sticky positioning** at top of viewport for maximum visibility
- **Color-coded phases** with distinct backgrounds and borders
- **Animation effects** including fade-in, scale, and pulse for urgent messages
- **Context-aware tips** that change based on game phase and user role
- **Urgency indicators** with special styling for time-critical moments

**Design Tokens**:
```css
/* Colors by Phase */
.phase-waiting { border: blue-500, bg: blue-50, text: blue-900 }
.phase-speech { border: green-500, bg: green-50, text: green-900 }
.phase-voting { border: red-500, bg: red-50, text: red-900 }
.phase-defense { border: purple-500, bg: purple-50, text: purple-900 }
.phase-survival { border: orange-500, bg: orange-50, text: orange-900 }
.phase-guess { border: yellow-500, bg: yellow-50, text: yellow-900 }
.phase-gameover { border: emerald-500, bg: emerald-50, text: emerald-900 }
```

**Accessibility**:
- ARIA labels for screen readers
- High contrast color combinations
- Focus management for interactive elements
- Keyboard navigation support

### 2. **GamePhaseIndicator Component**

**Purpose**: Visual progress tracking and phase information

**Key Features**:
- **Multi-level progress bars** (timer progress + overall game progress)
- **Step-by-step visual indicator** showing game progression
- **Real-time timer** with color-coded urgency levels
- **Status badges** showing player readiness and voting completion
- **Responsive design** that adapts to screen size

**Progress States**:
- Green: Normal time remaining (>30 seconds)
- Yellow: Warning time (10-30 seconds)  
- Red: Critical time (≤10 seconds)

### 3. **PlayerStatusPanel Component**

**Purpose**: Real-time player status and activity monitoring

**Key Features**:
- **Live status indicators** (online/offline, ready, voting, etc.)
- **Role-based styling** with distinct colors for host, liar, suspected player
- **Activity timestamps** with relative time formatting
- **Vote count tracking** with visual indicators
- **Connection status** with pulse animations

**Status Types**:
```typescript
type PlayerStatus = 'offline' | 'active' | 'voted' | 'ready' | 'waiting'
type PlayerRole = 'host' | 'liar' | 'suspected' | 'citizen'
```

### 4. **GameActionInterface Component**

**Purpose**: Primary interaction interface for game actions

**Key Features**:
- **Phase-specific interfaces** that change based on game state
- **Input validation** with real-time feedback
- **Urgency indicators** for time-sensitive actions
- **Context-aware help text** and placeholder text
- **Error handling** with clear error messages

**Interface Types**:
- Text input for hints and defenses
- Player selection for voting
- Binary choice for final voting
- Word guessing interface

### 5. **ActivityFeed Component**

**Purpose**: Real-time activity log and game history

**Key Features**:
- **Auto-scrolling** to latest activities
- **Activity categorization** with distinct icons and colors
- **Timestamp formatting** with relative times
- **User highlighting** to distinguish own actions
- **Activity filtering** by type and importance

## Responsive Design Strategy

### Breakpoints
- **Mobile**: < 768px - Single column layout, collapsible sections
- **Tablet**: 768px - 1024px - Two column layout, condensed sidebar
- **Desktop**: 1024px - 1280px - Three column layout, full features
- **Large Desktop**: > 1280px - Four column layout, maximum information density

### Mobile Optimizations
- **Touch-friendly targets** (minimum 44px tap targets)
- **Swipe gestures** for navigation between sections
- **Collapsible sections** to save screen space
- **Simplified layouts** with essential information prioritized

## Animation & Interaction Design

### Animation Principles
- **Purposeful**: Every animation serves a functional purpose
- **Subtle**: Animations enhance rather than distract
- **Fast**: Durations between 0.2s - 0.8s for responsiveness
- **Consistent**: Similar animations use the same timing functions

### Key Animations
```css
/* Phase transitions */
.phase-enter { animation: slideIn 0.3s ease-out }

/* Urgent states */
.urgent { animation: pulse 2s infinite }

/* Success feedback */
.success { animation: bounce 0.6s ease }

/* Error feedback */
.error { animation: shake 0.5s ease-in-out }
```

### Interaction States
- **Hover**: Subtle elevation and color changes
- **Focus**: Clear focus rings for accessibility
- **Active**: Press states with feedback
- **Disabled**: Reduced opacity with cursor changes

## Performance Considerations

### Optimization Strategies
- **Lazy loading** for non-critical components
- **Memoization** for expensive calculations
- **Virtual scrolling** for large lists
- **Image optimization** with WebP format
- **Code splitting** by game phase

### Bundle Size Management
- **Tree shaking** to eliminate unused code
- **Component chunking** for efficient loading
- **Icon optimization** using selective imports
- **CSS purging** to remove unused styles

## Accessibility Features

### WCAG Compliance
- **AA Level** color contrast ratios
- **Keyboard navigation** for all interactive elements
- **Screen reader** compatibility with ARIA labels
- **Focus management** with logical tab order

### Inclusive Design
- **Color-blind friendly** color combinations
- **High contrast mode** support
- **Reduced motion** preferences respected
- **Text scaling** support up to 200%

## Testing Strategy

### Visual Regression Testing
- **Playwright** for automated UI testing
- **Chromatic** for visual diff detection
- **Cross-browser** compatibility testing
- **Device testing** across different screen sizes

### Accessibility Testing
- **axe-core** for automated a11y testing
- **Manual testing** with screen readers
- **Keyboard navigation** verification
- **Color contrast** validation

### Performance Testing
- **Lighthouse** audits for performance metrics
- **Bundle analysis** for size optimization
- **Real device testing** for performance validation

## Implementation Guidelines

### Component Structure
```
src/components/game/
├── ModeratorCommentary.tsx     # Prominent moderator guidance
├── GamePhaseIndicator.tsx      # Phase progress and timing
├── PlayerStatusPanel.tsx       # Player status monitoring  
├── GameActionInterface.tsx     # Primary user interactions
├── ActivityFeed.tsx           # Real-time activity log
└── GameFlowManager.tsx        # Orchestrates all components
```

### Styling Approach
- **Tailwind CSS** for utility-first styling
- **CSS Modules** for component-specific styles
- **Design tokens** for consistent values
- **Theme support** for light/dark modes

### State Management
- **Zustand** for game state management
- **React Query** for server state
- **Local state** for component-specific data
- **WebSocket** for real-time updates

## Future Enhancements

### Planned Features
- **Voice announcements** for accessibility
- **Gesture controls** for mobile devices
- **Customizable themes** and color schemes
- **Enhanced animations** with Framer Motion
- **Progressive Web App** features

### Scalability Considerations
- **Component library** extraction for reuse
- **Design system tokens** for consistency
- **Internationalization** support
- **A/B testing** infrastructure for UX optimization

---

This design system ensures a cohesive, accessible, and engaging user experience for the Liar Game while maintaining high performance and scalability standards.