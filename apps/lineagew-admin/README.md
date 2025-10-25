# LineageW Treasury Console

Vite + React admin console for the LineageW loot and settlement backend.

## Getting started

```bash
cd apps/lineagew-admin
npm install
npm run dev
```

Configuration uses `VITE_API_BASE_URL` (default `http://localhost:20021/api/lineage`).

- `VITE_BASE_PATH` (build-time, defaults to `/linw/`) controls the base URL injected into the Vite bundle so the app works under `https://zzirit.kr/linw`.
- `VITE_APP_BASE` (runtime, defaults to `/linw`) is forwarded to the React Router basename; override if the hosting path changes.

Pages cover members, bosses, boss kills, inventory, sales/settlements, clan fund, essences, global policy, analytics reports, and the CSV/JSON upload workflow described in `docs/lineagew/linw.md`.
