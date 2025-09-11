# 🧩 Advanced Component Development System

## Overview
**Priority**: 3 (After Game Flow Implementation)  
**Dependencies**: 01-CRITICAL_CSS_FIXES.md + 02-GAME_FLOW_IMPLEMENTATION.md completed  
**Impact**: Polished user interface and interactions  
**Estimated Time**: 10-14 hours

## Component Architecture Strategy
Based on FRONTEND_ARCHITECTURE.md and RESPONSIVE_DESIGN_GUIDE.md:

```
Component Hierarchy:
├── Layout Components (Structure)
├── Game Components (Functionality)  
├── UI Components (Reusable)
├── Form Components (Input handling)
└── Animation Components (Visual polish)
```

## AI Agent Prompts

### Prompt 1: Advanced UI Component Library
```
**Task**: Build comprehensive, reusable UI component library with Radix UI + Tailwind CSS

**Context**:
- Extend basic Card/Button/Input from CSS fixes
- Implement design system with consistent styling
- Mobile-first responsive components
- Accessibility compliance (WCAG 2.1 AA)
- Gaming theme with modern aesthetics

**Components to Implement**:

**1. Navigation Components**
- NavigationMenu: Main app navigation
- Breadcrumb: Game phase navigation
- Pagination: Multi-page content
- Tabs: Content switching interface

**2. Layout Components**  
- Container: Responsive content wrapper
- Grid: Flexible grid system
- Stack: Vertical/horizontal spacing
- Separator: Visual content division

**3. Data Display Components**
- Table: Player lists and scoreboards  
- Badge: Status indicators and labels
- Avatar: Player profile pictures
- Progress: Loading and game progress bars

**4. Feedback Components**
- Alert: System messages and notifications
- Toast: Temporary success/error messages
- Tooltip: Hover information
- Skeleton: Loading placeholders

**5. Overlay Components**
- Dialog: Modal windows for confirmations
- Popover: Contextual information panels
- Sheet: Sliding panels for mobile
- DropdownMenu: Action menus

**Design System Specifications**:
```typescript
// Color Palette
const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6', 
    600: '#2563eb',
    900: '#1e3a8a'
  },
  secondary: {
    50: '#fdf4ff',
    500: '#a855f7',
    600: '#9333ea', 
    900: '#581c87'
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
};

// Typography Scale
const typography = {
  h1: 'text-4xl font-bold tracking-tight',
  h2: 'text-3xl font-semibold',
  h3: 'text-2xl font-semibold', 
  body: 'text-base',
  caption: 'text-sm text-gray-600'
};

// Spacing Scale
const spacing = {
  xs: '0.5rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '3rem'
};
```

**Actions Required**:
1. Create component base classes with consistent styling
2. Implement responsive behavior for all components
3. Add comprehensive TypeScript prop interfaces
4. Include accessibility attributes (ARIA, roles, labels)
5. Add animation support with Framer Motion
6. Create comprehensive Storybook documentation

**Files to Create**:
- frontend/src/versions/main/components/ui/navigation-menu.tsx
- frontend/src/versions/main/components/ui/breadcrumb.tsx
- frontend/src/versions/main/components/ui/tabs.tsx
- frontend/src/versions/main/components/ui/container.tsx
- frontend/src/versions/main/components/ui/grid.tsx
- frontend/src/versions/main/components/ui/table.tsx
- frontend/src/versions/main/components/ui/badge.tsx
- frontend/src/versions/main/components/ui/avatar.tsx
- frontend/src/versions/main/components/ui/progress.tsx
- frontend/src/versions/main/components/ui/alert.tsx
- frontend/src/versions/main/components/ui/toast.tsx
- frontend/src/versions/main/components/ui/tooltip.tsx
- frontend/src/versions/main/components/ui/dialog.tsx
- frontend/src/versions/main/components/ui/popover.tsx
- frontend/src/versions/main/components/ui/sheet.tsx
- frontend/src/versions/main/components/ui/dropdown-menu.tsx

**Acceptance Criteria**:
1. ✅ All components render correctly across devices
2. ✅ Consistent design system implementation
3. ✅ Full TypeScript support with proper prop types
4. ✅ Accessibility testing passes WAVE validator
5. ✅ Mobile touch interactions work smoothly
6. ✅ Component library documented in Storybook
```

### Prompt 2: Game-Specific Interactive Components
```
**Task**: Create specialized interactive components for Liar Game functionality

**Context**:
- Game-specific components that extend base UI library
- Handle complex user interactions and game logic
- Real-time updates and state synchronization
- Mobile-optimized touch interfaces

**Game Components to Build**:

**1. Player Management Components**
```typescript
// PlayerCard: Display player info with status
interface PlayerCardProps {
  player: Player;
  isCurrentPlayer?: boolean;
  showRole?: boolean; // Only for self
  showSuspicion?: boolean;
  votingMode?: boolean;
  onVote?: (playerId: string) => void;
}

// PlayerList: Grid of player cards
interface PlayerListProps {
  players: Player[];
  currentPhase: GamePhase;
  currentUserId: string;
  onPlayerAction?: (playerId: string, action: string) => void;
}

// PlayerStatusPanel: Sidebar player information
interface PlayerStatusPanelProps {
  players: Player[];
  currentPhase: GamePhase;
  gameState: GameState;
}
```

**2. Phase-Specific Interactive Components**
```typescript
// HintInput: Specialized input for giving hints
interface HintInputProps {
  maxLength: number;
  bannedWords: string[];
  timeRemaining: number;
  onSubmit: (hint: string) => void;
  onValidation: (isValid: boolean, reason?: string) => void;
}

// VotingInterface: Touch-optimized voting system
interface VotingInterfaceProps {
  players: Player[];
  currentUserId: string;
  phase: 'VOTING_FOR_LIAR' | 'VOTING_FOR_SURVIVAL';
  onVote: (targetId: string, voteType: VoteType) => void;
  timeRemaining: number;
}

// DefensePanel: Interface for player defense
interface DefensePanelProps {
  accusedPlayer: Player;
  isDefending: boolean;
  questions: DefenseQuestion[];
  onDefenseSubmit: (statement: string) => void;
  onQuestionSubmit: (question: string) => void;
}
```

**3. Game Progress Components**
```typescript
// GamePhaseIndicator: Visual progress through phases
interface GamePhaseIndicatorProps {
  currentPhase: GamePhase;
  phaseProgress: number; // 0-100
  timeRemaining: number;
  totalPhases: number;
}

// ScoreTracker: Real-time score display
interface ScoreTrackerProps {
  scores: Record<string, number>;
  recentChanges: ScoreChange[];
  targetScore: number;
  animateChanges: boolean;
}

// ActivityFeed: Live game event feed
interface ActivityFeedProps {
  events: GameEvent[];
  maxEvents: number;
  showTimestamps: boolean;
  autoScroll: boolean;
}
```

**Actions Required**:
1. Design mobile-first touch interfaces
2. Implement real-time data binding
3. Add input validation and error handling
4. Create smooth animations for state changes
5. Add haptic feedback for mobile devices
6. Implement keyboard navigation for accessibility

**Files to Create**:
- frontend/src/components/game/PlayerCard.tsx
- frontend/src/components/game/PlayerList.tsx  
- frontend/src/components/game/PlayerStatusPanel.tsx
- frontend/src/components/game/HintInput.tsx
- frontend/src/components/game/VotingInterface.tsx
- frontend/src/components/game/DefensePanel.tsx
- frontend/src/components/game/GamePhaseIndicator.tsx
- frontend/src/components/game/ScoreTracker.tsx
- frontend/src/components/game/ActivityFeed.tsx

**Acceptance Criteria**:
1. ✅ All game components handle touch interactions smoothly
2. ✅ Real-time updates reflect immediately in UI
3. ✅ Input validation prevents invalid actions
4. ✅ Animations enhance without hindering usability
5. ✅ Components work seamlessly across all device sizes
6. ✅ Accessibility features support all interaction methods
```

### Prompt 3: Animation and Visual Effects System
```
**Task**: Implement engaging animations and visual feedback using Framer Motion

**Context**:
- Enhance user engagement with smooth animations
- Provide visual feedback for user actions
- Support reduced motion preferences
- Optimize performance for 60fps animations

**Animation Categories**:

**1. Page Transitions**
- Phase transition animations (slide, fade, zoom)
- Route changes with smooth transitions  
- Loading state animations
- Error state visual feedback

**2. Interactive Feedback**
- Button hover and click effects
- Form input focus animations
- Vote submission confirmations
- Score change celebrations

**3. Game Event Animations**
- Phase change announcements
- Timer countdown visual effects
- Player elimination animations
- Victory celebration sequences

**4. Micro-interactions**
- Hover effects on interactive elements
- Loading spinners and progress indicators
- Tooltip and popover entrance/exit
- Navigation menu animations

**Animation Specifications**:
```typescript
// Animation Variants
const animations = {
  // Page transitions
  pageSlide: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  
  // Score updates
  scoreUpdate: {
    initial: { scale: 1, y: 0 },
    animate: { scale: 1.2, y: -10 },
    exit: { scale: 1, y: 0, opacity: 0 },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  
  // Button interactions
  buttonPress: {
    whileTap: { scale: 0.95 },
    whileHover: { scale: 1.05 },
    transition: { duration: 0.1 }
  }
};

// Performance optimization
const animationConfig = {
  reducedMotion: 'prefers-reduced-motion: reduce',
  useGPUAcceleration: true,
  optimizeForMobile: true,
  maxConcurrentAnimations: 3
};
```

**Actions Required**:
1. Install and configure Framer Motion
2. Create reusable animation variants library
3. Implement page transition animations
4. Add interactive element feedback
5. Create game event celebration animations
6. Add reduced motion support
7. Optimize animation performance

**Files to Create**:
- frontend/src/animations/variants.ts
- frontend/src/animations/transitions.ts
- frontend/src/components/animations/PageTransition.tsx
- frontend/src/components/animations/ScoreAnimation.tsx
- frontend/src/components/animations/PhaseTransition.tsx
- frontend/src/hooks/useAnimations.ts
- frontend/src/utils/motionConfig.ts

**Acceptance Criteria**:
1. ✅ All animations run smoothly at 60fps
2. ✅ Reduced motion preferences are respected
3. ✅ Animations enhance rather than distract from gameplay
4. ✅ Mobile performance remains optimal with animations
5. ✅ Loading animations provide clear feedback
6. ✅ Victory animations create satisfying moments
```

### Prompt 4: Form Components and Input Validation
```
**Task**: Build robust form handling system for game interactions

**Context**:
- Game requires various input types (text, selection, voting)
- Real-time validation to prevent invalid actions
- Multi-step forms for complex game actions
- Mobile-optimized input interfaces

**Form Components Needed**:

**1. Game Input Components**
```typescript
// HintFormField: Specialized hint input with validation
interface HintFormFieldProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  bannedWords: string[];
  placeholder: string;
  timeRemaining: number;
  autoFocus?: boolean;
}

// VoteSelection: Single/multiple choice voting
interface VoteSelectionProps {
  options: VoteOption[];
  value: string | string[];
  onChange: (selection: string | string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  showResults?: boolean;
}

// DefenseTextArea: Multi-line defense statements
interface DefenseTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  minLength: number;
  placeholder: string;
  rows: number;
}
```

**2. Validation System**
```typescript
// Input validation rules
interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  bannedWords?: string[];
  custom?: (value: string) => boolean | string;
}

// Form validation state
interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}
```

**3. Multi-step Forms**
- Game setup configuration
- Player registration flow
- Complex voting procedures
- Settings and preferences

**Actions Required**:
1. Create base form components with validation
2. Implement real-time error feedback
3. Add accessibility features (ARIA, keyboard navigation)
4. Create mobile-optimized input interfaces
5. Build multi-step form navigation
6. Add form state persistence

**Validation Features**:
- Real-time validation as user types
- Visual error indicators
- Helpful error messages in Korean
- Prevention of banned word usage
- Character count displays
- Auto-suggestion for valid inputs

**Files to Create**:
- frontend/src/components/forms/HintFormField.tsx
- frontend/src/components/forms/VoteSelection.tsx
- frontend/src/components/forms/DefenseTextArea.tsx
- frontend/src/components/forms/FormField.tsx
- frontend/src/components/forms/FormErrors.tsx
- frontend/src/hooks/useForm.ts
- frontend/src/utils/validation.ts
- frontend/src/utils/formHelpers.ts

**Acceptance Criteria**:
1. ✅ All form inputs validate in real-time
2. ✅ Error messages are clear and helpful
3. ✅ Mobile interfaces work with virtual keyboards
4. ✅ Accessibility features work with screen readers
5. ✅ Form state persists during network issues
6. ✅ Multi-step forms navigate smoothly
```

### Prompt 5: Mobile-Specific Component Optimizations
```
**Task**: Optimize all components for mobile-first experience with touch interactions

**Context**:
- Primary target is mobile devices (phones, tablets)
- Touch-friendly interfaces with appropriate sizing
- Swipe gestures and mobile navigation patterns
- Performance optimization for mobile hardware

**Mobile Optimization Requirements**:

**1. Touch Interface Standards**
- Minimum 44px touch targets (Apple HIG)
- Adequate spacing between interactive elements
- Visual feedback for touch interactions
- Support for various screen sizes and orientations

**2. Mobile Navigation Patterns**
```typescript
// Bottom Sheet: Mobile-friendly modal alternative
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: 'auto' | '50vh' | '75vh' | '90vh';
}

// Sliding Panels: Space-efficient sidebars
interface SlidingPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  position: 'left' | 'right';
  overlay?: boolean;
  children: React.ReactNode;
}

// Mobile Tab Bar: Bottom navigation for phases
interface MobileTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  position: 'bottom' | 'top';
}
```

**3. Gesture Support**
- Swipe navigation between game phases
- Pull-to-refresh for game state updates
- Long-press for contextual menus
- Pinch-to-zoom for detailed views

**4. Mobile Performance**
```typescript
// Virtual scrolling for large lists
interface VirtualizedListProps {
  items: any[];
  itemHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  overscan?: number;
}

// Lazy loading for images and heavy components
interface LazyComponentProps {
  threshold?: number;
  placeholder?: React.ReactNode;
  children: React.ReactNode;
}
```

**Actions Required**:
1. Implement touch-friendly component variants
2. Add swipe gesture support with react-swipeable
3. Create mobile-specific navigation components
4. Optimize rendering performance for mobile
5. Add haptic feedback for iOS devices
6. Test across multiple mobile devices

**Mobile-Specific Features**:
- Bottom sheet modals instead of center dialogs
- Slide-out navigation panels
- Touch-optimized form controls
- Gesture-based interactions
- Mobile-specific animations
- Responsive typography scaling

**Files to Create**:
- frontend/src/components/mobile/BottomSheet.tsx
- frontend/src/components/mobile/SlidingPanel.tsx
- frontend/src/components/mobile/MobileTabBar.tsx
- frontend/src/components/mobile/TouchButton.tsx
- frontend/src/components/mobile/SwipeContainer.tsx
- frontend/src/hooks/useGestures.ts
- frontend/src/hooks/useMobile.ts
- frontend/src/utils/mobileOptimizations.ts

**Acceptance Criteria**:
1. ✅ All interactive elements meet 44px minimum size
2. ✅ Swipe gestures work smoothly without conflicts
3. ✅ Mobile navigation feels native and intuitive
4. ✅ Performance remains smooth on mid-range devices
5. ✅ Haptic feedback enhances touch interactions
6. ✅ Components adapt correctly to screen orientation changes
```

## Component Integration Strategy

### Design System Consistency
- All components follow unified design tokens
- Consistent spacing, typography, and color usage
- Standardized animation timing and easing
- Unified error handling and loading states

### State Management Integration
- Components connect seamlessly to Zustand stores
- Optimistic updates for better perceived performance
- Error boundaries for graceful failure handling
- Loading states for all async operations

### Accessibility Compliance
- WCAG 2.1 AA standards met for all components
- Screen reader compatibility tested
- Keyboard navigation support
- High contrast mode support

## Success Metrics

### Technical Quality
- [ ] Zero TypeScript errors across all components
- [ ] 100% mobile responsive design
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] Performance: 60fps animations, <100ms interactions

### User Experience
- [ ] Intuitive touch interactions on mobile
- [ ] Smooth animations enhance engagement
- [ ] Error states provide clear recovery paths
- [ ] Loading states prevent user confusion

### Code Quality
- [ ] Comprehensive Storybook documentation
- [ ] Reusable components with clear prop interfaces
- [ ] Consistent design system implementation
- [ ] Performance optimized for mobile devices

## Next Steps After Completion
1. **State Management**: Integrate components with enhanced Zustand stores
2. **WebSocket Integration**: Real-time updates for all interactive components
3. **Testing**: Unit tests for all component logic and interactions
4. **Performance**: Bundle optimization and code splitting
5. **Localization**: Korean language support and right-to-left text

## Dependencies for Next Prompts
- ✅ CSS system from 01-CRITICAL_CSS_FIXES.md working
- ✅ Game flow from 02-GAME_FLOW_IMPLEMENTATION.md implemented
- ✅ Component library completed before state management optimization
- ✅ Mobile optimization ready before WebSocket real-time features