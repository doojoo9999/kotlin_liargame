# Gameroom View Renewal Plan

## 1. Goals and Success Metrics
- Prevent chat input clipping on FHD (1920x1080) and smaller viewports while keeping core features visible.
- Increase central chat readability and usability, measured via zero blocked messages during QA and input latency under 0.5 s.
- Ensure new visual effects do not introduce noticeable performance regressions (frame drops <5%, CPU baseline unchanged).

## 2. Current Pain Points
- Bottom-fixed chat container collides with browser UI and hides the input bar in FHD.
- Layout reserves vertical space for header/footer rather than prioritising real-time chat content.
- Input field offers minimal feedback, so users cannot tell when a message is ready or sent.

## 3. Target Layout Concept
- Three-column (left / center / right) responsive grid with the center chat panel dominating width (>55% at FHD).
- Left rail: round status, subject, timer, and key action buttons fixed in place.
- Center panel: chat log, composer, and effect layer with independent scroll and custom scrollbars.
- Right rail: player list, vote/action history, and system notices with collapsible sections.
- Breakpoints fold the right rail under the chat below 1280 px, while preserving central focus.

## 4. Detailed Workstreams
1. Layout Refactor
   - Implement CSS Grid (preferred) or Flex combination to support 100vh height and three scrollable panels.
   - Decouple scroll behaviour per panel and keep the chat list auto-scrolling unless the user scrolls upwards.
   - Add responsive breakpoints for laptops/tablets and provide fallbacks for narrow widths.
2. Central Chat UX Enhancements
   - Improve message density, spacing, and alignment for readability; maintain visual hierarchy for speaker metadata.
   - Add new-message highlight, focused input styling, and send confirmation micro-animation.
   - Provide inline error and retry affordances for failed sends; avoid layout shifts while typing.
3. Supporting Panels Polish
   - Convert status widgets to reusable cards with clear typography and countdown visuals.
   - Group player and vote information with accordion/tabs to prevent overflow.
   - Surface critical alerts through shared toast/banner components aligned with existing design tokens.
4. Accessibility and Interaction Quality
   - Ensure keyboard navigation order, aria-live updates for incoming chat, and focus trapping within overlays.
   - Respect reduced-motion preferences and meet WCAG AA colour contrast for all new styles.
5. Performance and Technical Considerations
   - Audit bundle size/styling impact, clean unused CSS, and validate state store interactions after refactor.
   - Track WebSocket message throughput and maintain log virtualization if message volume is high.

## 5. Execution Phases
- Phase 1: Produce wireframes and motion references (Figma) and review with stakeholders.
- Phase 2: Refactor React layout in `apps/liar-game/src/pages/GameRoom` plus supporting components/stores.
- Phase 3: Integrate animations/effects, accessibility refinements, and styling polish.
- Phase 4: Run regression QA (multi-user sessions) and document release notes.

## 6. Validation Checklist
- Manual UI review on Chrome, Edge, and Firefox at FHD, 1440p, and common laptop breakpoints.
- Component tests or Storybook visual checks for new grid layout and chat behaviours.
- Run `npm run lint`, `npm run test:run`, and a targeted Playwright smoke for chat sending.
- Execute accessibility scans (axe, Lighthouse) and a keyboard-only walkthrough.
- Capture performance traces to confirm frame pacing and input latency remain stable.

## 7. Pre-launch Actions
- Verify styling scope (CSS Modules or styled-components) to avoid bleeding into other pages.
- Confirm WebSocket subscriptions still update the refactored panels correctly.
- Update `docs/game` or related guides with layout changes and QA sign-off notes.

## 8. Timeline and Risks
- Estimated effort: design 2d, implementation 4d, QA 2d (total 8 working days).
- Risk: animation or gradients add rendering cost -> provide a toggle or simplified mode.
- Risk: breakpoint regressions on legacy laptops -> maintain checklist per viewport and hotfix quickly.
## 9. UI/UX 개선안 (2025-09-22 업데이트)
1. 헤더 영역의 실측 높이를 CSS 변수로 노출하고, 본문 그리드를 `calc(100vh - header)` 높이로 제한해 FHD에서 아래 콘텐츠가 잘리지 않도록 한다.
2. 루트 컨테이너에 `min-h-screen`과 안전 여백 패딩을 적용하여 뷰포트를 꽉 채우고 모바일 하단 노치를 대비한다.
3. 그리드 템플릿 비율을 재조정해 중앙 채팅 칼럼이 최소 60% 폭을 확보하고, 좌우 레일은 280px~340px 범위에서 유연하게 동작하도록 한다.
4. 좌·우 레일 컨테이너에 독립 스크롤과 `scrollbar-gutter`를 부여해 긴 목록에서도 헤더/푸터와 겹치지 않게 한다.
5. 채팅 카드가 부모 높이를 가득 채우도록 `flex` 레이아웃과 `max-height` 계산을 정비해 입력창이 항상 시야에 들어오게 한다.
6. 채팅창의 안내 문구·버튼 라벨·토스트 메시지를 한국어로 정비하고, 포커스/전송 효과를 자연스럽게 보강한다.
7. 메시지 타입 토글과 새 메시지 알림 UI를 한국어로 개선하고 가독성 높은 색상 대비를 적용한다.
8. 입력창에 남은 글자 수 카운터와 80% 경고 색상을 추가해 과도한 입력을 미리 방지한다.
9. 타이핑 인디케이터와 재전송 안내 문구를 자연어 한국어로 바꾸고 스크린 리더용 `aria-live` 영역을 보강한다.
10. 반복 사용되는 경고/토스트 문구를 한글화하고, 오류 안내가 상단 고정 헤더 아래에서도 명확히 보이도록 배치한다.
