# Stellive Fan Project · Image Usage Plan

This guide maps the downloaded assets in `docs/imgs/` to recommended contexts across the upcoming redesign. Keep this alongside `manifest.json` so every module can pull consistent visuals without re-evaluating choices per sprint.

## 1. Group Visuals (Landing & Shared Backgrounds)

| Filename | Suggested Placement | Notes |
| --- | --- | --- |
| `group-stellive-01.jpg` | Main hero slide #1 (desktop) | Wide composition with strong central focus; pair with festival CTA. |
| `group-stellive-02.jpg` | Main hero slide #2 (desktop/mobile) | Bright palette; works for “Community Events” messaging. |
| `group-stellive-03.jpg` | News section header background | Apply blur/overlay for readability; good for stacked cards. |
| `group-stellive-04.jpg` | Game lobby background (glassmorphism layer) | Use as subtle parallax image behind lobby cards. |
| `group-stellive-05.png` | Footer splash or About hero on fan wiki page | Transparent background allows layering over gradients. |

## 2. Per-Member Assets (Cards, Profiles, Game UI)

For each member, use the following breakdown:

- **Primary Card Image (PC)**: square/portrait shot for landing “Talents” cards and roster tiles in games.
- **Secondary Gradient Overlay (SG)**: more dynamic pose suited for hover states, detail modals, or CTA banners.
- **Avatar/Token (AT)**: clean bust shot for chat avatars, turn indicators, or leaderboard icons.

| Member | PC | SG | AT |
| --- | --- | --- | --- |
| 강지 (Kang Ji) | `kangji-01.png` | `kangji-02.png` | `kangji-03.jpg` |
| 유니 (Ayatsuno Yuni) | `yuni-01.jpg` | `yuni-02.png` | `yuni-03.png` |
| 후야 (Huya) | `huya-01.jpg` | `huya-02.jpg` | `huya-03.png` |
| 타비 (Arahasi Tabi) | `tabi-01.png` | `tabi-02.jpg` | `tabi-03.png` |
| 리제 (Akane Lize) | `lize-01.jpg` | `lize-02.png` | `lize-03.jpg` |
| 마시로 (Nenekoma Mashiro) | `mashiro-01.png` | `mashiro-02.png` | `mashiro-03.png` |
| 히나 (Shirayuki Hina) | `hina-01.png` | `hina-02.jpg` | `hina-03.png` |
| 나나 (Hanako Nana) | `nana-01.png` | `nana-02.jpg` | `nana-03.jpg` |
| 린 (Miruku Rin) | `rin-01.png` | `rin-02.jpg` | `rin-03.jpg` |
| 리코 (Riko) | `riko-01.jpg` | `riko-02.webp` | `riko-03.jpg` |
| 시부키 (Tenko Shibuki) | `shibuki-01.webp` | `shibuki-02.png` | `shibuki-03.jpg` |

## 3. Feature Modules & Event Flows

- **Landing “News” Cards**: pair each feature article with the matching member’s SG image for hover overlays; fallback to `group-stellive-03.jpg` for cross-member announcements.
- **Music/Media Highlights**: use PC images as square thumbnails framed with the Stellive fan gradient; animate SG images as background flourishes on play state.
- **Game Result Screens**: celebrate winning member with their SG image full-bleed plus AT for scoreboard chips.
- **Chat & Presence Avatars**: strictly use AT assets to keep clarity at small sizes (<48px).
- **Modal/Guideline Pages**: incorporate `group-stellive-05.png` as decorative starfield, ensuring fan disclaimers layer on top.

## 4. Responsive & Accessibility Considerations

- Mobile hero: prefer `group-stellive-02.jpg` and `group-stellive-05.png` due to high-contrast focal areas that crop well at 16:9 and 9:16.
- Always provide `alt` text referencing “Fan art of [member] (unofficial, credit pending)” until artist credits are finalized.
- When using WebP/PNG with transparency (`group-stellive-05.png`, `riko-02.webp`, etc.), place over gradients from the Stellive fan palette to maintain contrast.

## 5. Next Steps

1. Collect artist credit info referencing `docs/imgs/manifest.json` before shipping.
2. Generate optimized responsive variants (e.g., 480px, 960px) once page layouts are locked.
3. Align component implementations (card, modal, avatar) to consume these filenames via the shared asset map or CMS entries.

Keep this document updated if any asset gets replaced or resized so design/dev remain in sync.
