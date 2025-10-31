# ADR-004: Text Detection Policy

## Status
Accepted — 2024-10-09

## Context
Legacy guidelines banned ASCII/letterform puzzles, suppressing user creativity and leading to manual moderation overhead. The updated policy allows all pixel art while tagging text-like content for downstream ranking adjustments. We must formalize how the platform identifies and uses text-likeness scores without punitive actions.

## Decision
- Integrate a lightweight OCR pipeline (Tesseract.js for frontend previews, Tesseract CLI in worker) combined with heuristics (stroke continuity, aspect ratios) to produce `text_likeness_score` (0.0~1.0) and `content_style`.
- Tagging is metadata only; submissions are never rejected solely on text likeness. Moderation actions (reject, blind) occur only for explicit policy violations (copyright, hate, adult).
- Store generated tags and scores in `puzzles` table for search/filtering and to feed the recommendation engine. Expose the tags to authors for transparency.
- Allow operators to tune ranking weights (e.g., deprioritize high text-likeness in "classic" feeds) without code changes via configuration.

## Consequences
- Algorithm updates may shift scores retroactively; we need backfill jobs to recompute metadata when the heuristic changes.
- OCR workloads increase compute needs in the puzzle worker; caching intermediate results and leveraging GPU-enabled runners can mitigate latency.
- Clear communication to creators is vital to avoid confusion; we document the policy prominently in guidelines and the editor UI.
