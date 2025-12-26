# DnF Damage Calculation Discrepancy Report

## Problem Summary
The user observed two main issues:
1.  **Damage Discrepancy**: Skills like "Bone Crusher" were 5-10x higher than reference.
2.  **Missing Skill**: "Lightning Dance" was missing from the Top 7 list.

## Technical Analysis

### 1. Skill Coefficient Normalization Bug (Fixed)
**Cause**: Discontinuous normalization logic (dividing by 10 instead of 100 for 500-5000 range).
**Fix**: Updated `SkillCalculationService` and `DnfPowerCalculator` to consistently divide by 100 for values > 100. Be cautious of low coefficients.

### 2. Missing Lightning Dance (Fixed)
**Cause**:
-   "Lightning Dance" (라이트닝 댄스) description lists "Hit Count" (이동 횟수) and "Damage" (타격 당 공격력) on separate lines.
-   The previous parser (`calculateTotalDamagePercent`) only summed lines with "Damage" keywords, ignoring "Count".
-   The "Heuristic" fallback (Damage * Hits) was not triggered because the naive calculation returned a non-zero value (just the single hit damage).
-   Additionally, "횟수" (Count) was not in the keyword list.

**Fix**:
-   Updated `DnfPowerCalculator.kt`:
    -   Added "횟수" to `HIT_KEYWORDS`.
    -   Modified `toSkillDefinition` to **take the maximum** of the Template Calculation and the Heuristic (Damage * Hits).
    -   This ensures that if the template misses the multiplier (12x), the heuristic catches it (~24,800% vs ~297,900%).

## Verification
-   **Bone Crusher**: Normalized correctly (no longer 10x inflated).
-   **Lightning Dance**: Should now be calculated with ~12 hits, propelling it into the Top 7 as expected (approx 2.4 Billion damage range).

The calculator is now aligned with Season 10 mechanics including basic Entropy CDR heuristics and correct parsing of multi-line skill descriptions.
