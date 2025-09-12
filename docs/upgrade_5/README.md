# 🚀 Frontend Development Implementation Guide

## Overview

This directory contains comprehensive AI prompts for systematic frontend development of the Liar Game multiplayer social deduction game. Each prompt is designed to be self-contained with clear acceptance criteria, enabling AI agents to work systematically through the complete implementation.

## 📋 Implementation Sequence

**CRITICAL**: These prompts must be completed in order due to dependencies.

### 1. 🚨 Priority 1: CSS & Component Fixes
**File**: `01-CRITICAL_CSS_FIXES.md`  
**Status**: CRITICAL - Must be completed first  
**Time**: 4-6 hours  

**Issues Addressed**:
- ❌ Tailwind CSS compilation/application failure
- ❌ UI components not loading properly (@/versions/main/components/ui/)
- ❌ PostCSS configuration issues
- ❌ Component import/export problems

**Key Deliverables**:
- Working Tailwind CSS system with gradient backgrounds
- Functional UI component library (Card, Button, Input)
- Proper TypeScript path mapping
- Login page displaying correctly with professional styling

---

### 2. 🎮 Game Flow Implementation
**File**: `02-GAME_FLOW_IMPLEMENTATION.md`  
**Dependencies**: 01-CRITICAL_CSS_FIXES.md completed  
**Time**: 12-16 hours

**Game Phases Implemented**:
1. **WAITING** (대기) - Players joining lobby
2. **SPEECH** (힌트 타임) - Sequential hint giving, 45s per player
3. **VOTING_FOR_LIAR** (라이어 지목) - Vote for suspected liar, 60s
4. **DEFENDING** (라이어 변론) - Accused player defense, 90s
5. **VOTING_FOR_SURVIVAL** (생존 투표) - Final elimination vote, 45s
6. **GUESSING_WORD** (정답 추측) - Liar guesses word, 30s
7. **GAME_OVER** (게임 종료) - Results and scoring

**Key Deliverables**:
- Zustand store for game state management
- Phase-specific React components
- Timer management system with server synchronization
- Scoring calculation engine
- Moderator commentary system

---

### 3. 🧩 Advanced Component Development
**File**: `03-COMPONENT_DEVELOPMENT.md`  
**Dependencies**: 02-GAME_FLOW_IMPLEMENTATION.md completed  
**Time**: 10-14 hours

**Component Categories**:
- **UI Library**: Navigation, layout, data display, feedback, overlay components
- **Game Components**: Player management, phase-specific interactions, progress tracking
- **Animation System**: Framer Motion integration with 60fps performance
- **Form Components**: Input validation and multi-step forms
- **Mobile Optimization**: Touch interfaces, gestures, responsive design

**Key Deliverables**:
- Comprehensive UI component library with design system
- Game-specific interactive components
- Smooth animations and visual effects
- Robust form handling with validation
- Mobile-first responsive optimization

---

### 4. ⚡ State Management & WebSocket
**File**: `04-STATE_MANAGEMENT_WEBSOCKET.md`  
**Dependencies**: 03-COMPONENT_DEVELOPMENT.md completed  
**Time**: 14-18 hours

**Integration Systems**:
- **Enhanced Zustand Stores**: GameStore, UIStore, ConnectionStore
- **WebSocket Service**: STOMP protocol integration with Kotlin backend
- **Real-time Sync**: Optimistic updates, conflict resolution, event processing
- **API Service Layer**: React Query integration with retry strategies
- **Performance Optimization**: Message batching, memoization, monitoring

**Key Deliverables**:
- Multi-store Zustand architecture with persistence
- Robust WebSocket service with reconnection
- Real-time state synchronization system
- Comprehensive API service layer
- Performance optimization and monitoring

---

### 5. 🧪 Testing & Quality Assurance
**File**: `05-TESTING_QUALITY_ASSURANCE.md`  
**Dependencies**: All previous prompts completed  
**Time**: 12-16 hours

**Testing Categories**:
- **Unit Tests**: Vitest + React Testing Library (85%+ coverage)
- **Integration Tests**: WebSocket communication, state synchronization
- **E2E Tests**: Playwright with cross-browser and mobile testing
- **Quality Gates**: ESLint, TypeScript, accessibility, security
- **Performance Testing**: Core Web Vitals, load testing with k6

**Key Deliverables**:
- Comprehensive test suite with high coverage
- Real-time feature integration testing
- End-to-end user journey validation
- Code quality enforcement and automation
- Performance monitoring and regression detection

---

## 🎯 Success Criteria

### Technical Quality
- [ ] Zero TypeScript errors or ESLint warnings
- [ ] 85%+ test coverage across all modules
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] Core Web Vitals meet Google thresholds

### Performance Targets
- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] FID (First Input Delay): < 100ms
- [ ] CLS (Cumulative Layout Shift): < 0.1
- [ ] WebSocket latency: < 100ms for 95% of messages

### User Experience
- [ ] Complete game playable from start to finish
- [ ] Mobile-responsive design on all devices
- [ ] Real-time multiplayer synchronization working
- [ ] Korean language support throughout interface

### Production Readiness
- [ ] CI/CD pipeline with quality gates
- [ ] Comprehensive error handling and recovery
- [ ] Performance monitoring and alerting
- [ ] Security testing passed

---

## 🛠 Technology Stack

### Core Technologies
- **Framework**: React 19 with TypeScript
- **State Management**: Zustand with persistence
- **Styling**: Tailwind CSS + Radix UI components
- **Real-time**: WebSocket with STOMP protocol
- **API**: React Query (TanStack Query)
- **Testing**: Vitest + React Testing Library + Playwright
- **Build**: Vite with performance optimization

### Backend Integration
- **Backend**: Kotlin Spring Boot
- **WebSocket**: STOMP messaging protocol
- **API**: RESTful endpoints with JWT authentication
- **Database**: Game state and player management

---

## 📱 Mobile-First Design

### Responsive Breakpoints
- **Mobile**: 320px - 768px (Primary target)
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### Touch Optimization
- Minimum 44px touch targets
- Swipe gestures for navigation
- Haptic feedback integration
- Virtual keyboard compatibility

---

## 🌐 Korean UX Specifications

### Language Support
- Complete Korean localization
- Proper font rendering (Orbitron/Inter)
- Right-to-left text support where needed
- Cultural adaptation of game mechanics

### Game Flow (Korean)
```
게임시작 → 주제+답안 확인 → 힌트 타임 → 라이어 지목 → 
라이어 변론 → 생존 투표 → 승점 획득 → 게임 승리
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Frontend development environment set up
- Access to Kotlin backend (localhost:8080)
- Understanding of React 19 and TypeScript

### Implementation Process

1. **Start with Priority 1**: Begin with `01-CRITICAL_CSS_FIXES.md`
2. **Follow Dependencies**: Complete each prompt before moving to next
3. **Test Continuously**: Run tests after each major milestone
4. **Mobile Testing**: Test on actual devices throughout development
5. **Performance Monitoring**: Track metrics from early development

### Validation Commands
```bash
# After each prompt completion
npm run typecheck    # TypeScript validation
npm run lint        # Code quality
npm run test        # Unit tests
npm run build       # Production build
npm run dev         # Development server
```

---

## 📚 Additional Resources

### Documentation References
- `FINAL_CSS_ASSESSMENT.md` - Current CSS issues analysis
- `FRONTEND_ARCHITECTURE.md` - Component hierarchy design
- `GAME_FLOW_DESIGN.md` - Complete game mechanics
- `IMPLEMENTATION_STRATEGY.md` - State management patterns
- `RESPONSIVE_DESIGN_GUIDE.md` - Mobile optimization
- `TESTING_AND_DEPLOYMENT.md` - Quality assurance

### External Documentation
- [React 19 Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand State Management](https://zustand-demo.pmnd.rs/)
- [Vitest Testing Framework](https://vitest.dev/)
- [Playwright E2E Testing](https://playwright.dev/)

---

## ⚠️ Critical Notes

### Development Order
**MUST follow the numbered sequence** - dependencies are strict and implementation will fail if order is not followed.

### CSS Priority
**01-CRITICAL_CSS_FIXES.md MUST be completed first** - no other development should proceed until the CSS system is fully operational.

### Testing Requirements
Each prompt includes specific acceptance criteria that must be met before proceeding to the next phase.

### Performance Targets
Performance requirements are not optional - they ensure smooth real-time multiplayer gameplay.

---

**Status**: Ready for systematic implementation  
**Last Updated**: 2025-01-11  
**Estimated Total Time**: 52-70 hours  

This systematic approach ensures a production-ready, high-quality Liar Game frontend that delivers an exceptional multiplayer gaming experience.