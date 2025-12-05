# DnF Raid Organizer Implementation Plan

## Goal Description
Create a premium web-based Raid Organizer for the "Dungeon & Fighter" (DnF) Diregie Raid. The system will use the existing `zzirit.kr` architecture (Kotlin/Spring Boot Backend + React Frontend). It allows users to apply with their characters and Raid Leaders to organize parties, including a feature to clone previous raid configurations.

## User Review Required
> [!IMPORTANT]
> **DnF API Key**: The API Key is provided: `p6VrEhm2v0t6DqvwyLYbJ3yTMatfYFbD`.
> **Database**: We will use the existing PostgreSQL instance and create new tables (`dnf_raids`, `dnf_participants`).

## Proposed Architecture

### Tech Stack
- **Backend**: Kotlin + Spring Boot (in `src/main/kotlin/org/example/dnf_raid`)
- **Frontend**: React + Vite + TypeScript + TailwindCSS (in `apps/dnf-raid`)
- **Database**: PostgreSQL (Existing)
- **Styling**: TailwindCSS with a focus on "Premium Gaming" aesthetic (Dark mode, Glassmorphism).

### Directory Structure
```
/
├── apps/
│   └── dnf-raid/ (New React App)
│       ├── src/
│       │   ├── components/ (UI Components)
│       │   ├── pages/ (Routes)
│       │   ├── hooks/ (Data fetching)
│       │   └── services/ (API calls)
│       └── ...
├── src/
│   └── main/
│       └── kotlin/
│           └── org/
│               └── example/
│                   └── dnf_raid/ (New Backend Module)
│                       ├── controller/
│                       ├── service/
│                       ├── repository/
│                       └── model/
```

## Detailed Feature Specifications

### 1. Applicant Page
- **Character Search**:
  - Input: Character Name.
  - Logic:
    1. **Search API**: Call Neople API to get list of matches.
    2. **Cache Check**: For selected character, check `dnf_characters` table.
    3. **Fetch & Cache**: If not in DB (or stale > 24h), call API for details and upsert to `dnf_characters`.
  - Display: Character Card with Image, Fame, Job.
- **Application Form**:
  - **Auto-Fill**: Load data from `dnf_characters` (cached).
  - **Manual Input**: Damage (Dealer) / Buff Power (Buffer).
    - **Source**: User looks up their character on **dundam.xyz** and enters the value.
    - **History Tracking**: Every update to stats is saved to `dnf_stat_history`.
  - **Visuals**: High-quality character images as background/avatar.

### 2. Raid Leader Page
- **Dashboard**:
  - **Import/Clone**: Button to "Load Last Week's Raid". Copies participants and settings to a new Raid ID.
  - **Drag & Drop**: Interactive board to move users between "Unassigned" and "Party 1/2/3".
  - **Stat History**: Leader can view a log of damage/buff updates for each applicant (e.g., "Updated from 1000억 to 1200억").
- **Party Composition**:
  - 3 Parties x 4 Slots.
  - **Validation**: Visual warning if no Buffer in a party.
  - **Stats**: Real-time calculation of Party Average Damage/Buff.
  - **Share Page**: A dedicated read-only page (`/share/[raidId]`) optimized for mobile/desktop viewing to share the final lineup.

### 3. Data Model (PostgreSQL)
- **Table `dnf_raids`**:
  - `id` (UUID, PK)
  - `user_id` (BIGINT, FK -> users.id)
  - `name` (VARCHAR)
  - `password` (VARCHAR, nullable)
  - `created_at` (TIMESTAMP)
  - `parent_raid_id` (UUID, nullable, for cloning)
- **Table `dnf_characters` (Cache)**:
  - `character_id` (VARCHAR, PK)
  - `server_id` (VARCHAR)
  - `character_name` (VARCHAR)
  - `job_name` (VARCHAR)
  - `job_grow_name` (VARCHAR)
  - `fame` (INTEGER)
  - `adventure_name` (VARCHAR)
  - `last_updated_at` (TIMESTAMP)
- **Table `dnf_participants`**:
  - `id` (UUID, PK)
  - `raid_id` (UUID, FK)
  - `character_id` (VARCHAR, FK -> dnf_characters)
  - `damage` (BIGINT)
  - `buff_power` (BIGINT)
  - `party_number` (INTEGER, 1-3)
  - `slot_index` (INTEGER, 0-3)
- **Table `dnf_stat_history`**:
  - `id` (UUID, PK)
  - `participant_id` (UUID, FK -> dnf_participants)
  - `damage` (BIGINT)
  - `buff_power` (BIGINT)
  - `created_at` (TIMESTAMP)

## Verification Plan

### Automated Tests
- **Backend**: JUnit tests for `RaidService` (cloning logic, validation).
- **Frontend**: Vitest for Party Board component (Drag & Drop logic).

### Manual Verification
1. **Setup**: Run Spring Boot app and `apps/dnf-raid` dev server.
2. **Flow**:
   - Create Raid A.
   - Add 2 Applicants. Assign to Party 1.
   - Create Raid B (Clone Raid A).
   - Verify Raid B has the same 2 Applicants in Party 1.
3. **UI Check**: Verify Character Images load correctly and "Premium" aesthetic is applied.
