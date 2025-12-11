# DnF Damage Formula (Midheaven Season, Dec 2025)

## Sources (Dec 2025)
- Namu Wiki: `Dungeon & Fighter / Damage Calculation` (last edited 2025-12-02).
- Dundam calculator (https://dundam.xyz) – separates skill atk%, dmg%, add dmg, final dmg, crit dmg, ele atk.
- 2025 community posts (Tistory/Naver, May–Nov 2025) – 115 gear/fusion options slot into existing categories; no new multiplier types.

## High-level flow
1. Base skill damage:  
   `(Weapon Atk + Add Atk + Phys/Mag constant) * Skill% + Skill fixed dmg`
2. Stats: multiply by `(1 + STR/INT / 250)` and job base modifiers.
3. Defense & level: apply monster def and level gap; def pierce/def reduction are used here.
4. Multipliers: apply categories below (same category sums, different categories multiply).
5. Situational: counter/back/headshot, party synergy buffs, etc.

## Multiplier categories (sum inside, multiply outside)
- `Skill Atk% (SA)` – sum all SA.
- `Damage Increase (DI)` – sum all DI.
- `Additional Damage (AD)` – sum all AD.
- `Final Damage (FD)` – sum all FD.
- `Critical Damage (CD)` – crit assumed; base 1.5x then add crit dmg/extra crit dmg.
- `Elemental (Elem)` – `1 + (ElemAtk - MonsterResist) * 0.0045` (≈ Elem/220). Multi-element add-dmg joins here.
- `Situational` – counter/back/headshot, grab, airborne, etc.; sum within each type, then multiply with others.
- `Party/synergy` – e.g., party 34% dmg; separate lane, multiplicative to above.
- `Misc caps` – hit count caps, skill-specific bonuses remain outside generic lanes.

## Item & fusion behavior (115 gear, Midheaven)
- Fusion options use existing lanes: SA/DI/AD/FD/CD/Elem/DefPierce. No new lane is introduced.
- Set points often add SA/FD/Elem; they stack additively inside each lane.
- Because lanes multiply, avoid oversaturating one lane; raise the lowest lane for best marginal gain.
- Def-pierce/def-reduction are pre-multiplier and shine vs high-defense mobs.

## Practical optimization
- Hit 100% crit first; then invest in CD.
- Elem efficiency is highest when your elem atk is low or monster resist is high.
- Balance lanes: SA ≈ DI ≈ AD ≈ FD with adequate CD/Elem yields better returns than min-maxing one lane.
- Use fusion/set bonuses to fill weak lanes or add def-pierce for endgame bosses.
- Maintain party synergy uptime; it multiplies all personal lanes.

## Reference pseudo-formula
```
Damage =
  BaseSkill *
  StatCoeff *
  DefCoeff *
  (1 + SA) *
  (1 + DI) *
  (1 + AD) *
  (1 + FD) *
  CritBase * (1 + CD) *
  (1 + ElemCoeff) *
  (1 + Situational) *
  (1 + PartySynergy)
```
Where:
- `CritBase` = 1.5 when crit is guaranteed.
- `ElemCoeff` = (ElemAtk - MonsterResist) * 0.0045.
- `Situational` sums each situational bucket (counter/back/etc.) before multiplying.
