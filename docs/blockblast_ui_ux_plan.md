# Block Blast UI/UX Improvement Plan

## Overview
This document outlines 10 key UI/UX improvements for the Block Blast project. It incorporates specific user feedback regarding visibility, camera perspective, and layout stability, while adding complementary features to enhance the overall experience.

## Core User Requirements (High Priority)

### 1. Fixed Top-Down Orthographic View
- **Problem**: The previous diagonal/isometric view reduced visibility and made precise placement difficult.
- **Solution**: Switch to a **Fixed Top-Down View** using an `OrthographicCamera`.
- **Details**:
    - Remove perspective distortion.
    - Lock camera rotation and panning.
    - Ensure the grid looks like a perfect 2D board but with 3D depth (e.g., blocks have slight height/bevel).

### 2. High-Visibility Grid System
- **Problem**: The board lacks visual clarity for cell boundaries.
- **Solution**: Implement a permanent **Checkerboard or Grid Line Pattern**.
- **Details**:
    - Apply alternating background colors (e.g., light/dark gray) to the 8x8 or 10x10 grid slots.
    - Ensure empty slots are clearly distinguishable from placed blocks.
    - **Note**: User mentioned "Map size reduction" - we will ensure the grid fits comfortably within the viewport with minimal margins.

### 3. Static & Compact Map Layout
- **Problem**: The map moves or is too large/spread out.
- **Solution**: **Lock the Map Position** and optimize its scale.
- **Details**:
    - Disable all camera movement (OrbitControls).
    - Center the board vertically and horizontally.
    - Reduce padding around the board to make it compact, focusing attention on the gameplay area.

### 4. Consistent Tray Block Sizing (Normalization)
- **Problem**: Blocks in the "Pick a Block" (Tray) area change size or cause layout shifts depending on their shape (1x1 vs 3x3).
- **Solution**: Implement **Normalized Scale Containers** for tray items.
- **Details**:
    - Define a fixed bounding box for each of the 3 tray slots.
    - Scale down larger blocks (e.g., 3x3, 4x1) to fit within this box.
    - Scale up smaller blocks (e.g., 1x1) slightly but keep them visually proportional relative to the max size, OR force a uniform cell size for display in the tray so they look consistent.
    - **Goal**: The tray layout never "jumps" or resizes when new blocks spawn.

### 5. Enhanced Block Visibility (Visual Clarity)
- **Problem**: Blocks might blend into the background or each other.
- **Solution**: Add **Inner Borders / Bevels** and **Drop Shadows**.
- **Details**:
    - Even in top-down view, add a subtle drop shadow to active blocks to lift them off the board.
    - Use a slight inner glow or border on blocks to separate them visually from adjacent blocks of the same color.

---

## Additional UI/UX Enhancements

### 6. Smart Ghost & Drop Preview
- **Feature**: Show exactly where the block will land.
- **Details**:
    - Display a semi-transparent "Ghost Block" on the grid when dragging.
    - **Crucial**: If the placement is invalid, turn the Ghost Block red.
    - **Crucial**: If the placement will clear lines, highlight those lines (e.g., white flash or glow) *before* the player releases the block.

### 7. "Touch Offset" Control for Mobile
- **Feature**: Solve the "finger covering the block" issue.
- **Details**:
    - When dragging on touch devices, render the actual block slightly *above* the touch point (Y-axis offset in 2D screen space).
    - This allows the player to see exactly where they are placing the block underneath their finger.

### 8. Minimalist HUD & "Safe Zone"
- **Feature**: Clean interface that prevents accidental clicks.
- **Details**:
    - Move Score, High Score, and Settings buttons to the very top header.
    - Ensure the bottom area (Tray) has enough "dead zone" below it so swipe gestures (like closing apps on iPhone) don't interfere with picking up blocks.

### 9. Combo & Clear Visual Feedback (Static Camera)
- **Feature**: Excitement without motion sickness.
- **Details**:
    - Since we removed camera shake, use **Screen Flash** (subtle) or **Border Glow** effects for combos.
    - Display floating text ("Combo x2!", "Perfect!") that drifts up and fades out, keeping the board itself static.

### 10. "No Moves" Warning & Grey-out
- **Feature**: Clear indication of game state.
- **Details**:
    - When a block in the tray *cannot* be placed anywhere on the current board, visually "grey it out" or darken it immediately.
    - If *none* of the blocks can be placed, trigger the Game Over state instantly (or after a short "realization" pause), rather than letting the player try to drag them in vain.

## Implementation Steps
1.  **Update `GameScene.tsx`**: Configure `OrthographicCamera`, disable controls, fix position.
2.  **Update `Board.tsx`**: Add grid texture/shader, adjust scaling.
3.  **Update `Tray.tsx`**: Implement the scaling logic to fit blocks into fixed-size slots.
4.  **Update `Block.tsx`**: Add offset logic for drag and visual enhancements (borders).
5.  **Update `useGameLogic`**: Add "preview" state for line clearing highlights.
