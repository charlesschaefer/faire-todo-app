# Copilot Instructions for Faire Todo App

## Project Overview
- **Faire Todo App** is an offline-first, cross-platform task manager built with Angular (frontend) and Tauri (desktop/mobile shell).
- Data is stored locally using IndexedDB (via Dexie.js) and can be synchronized:
  - **Offline sync**: peer-to-peer over local network
  - **Online sync**: via Supabase backend, authenticated with Google OAuth

## Architecture & Key Components
- **Frontend**: Angular app in `src/app/` (tasks, projects, tags, inbox, etc.)
- **Database**: `src/app/db/app.db.ts` defines Dexie tables for all entities (task, project, tag, user, etc.)
- **Services**: Business logic and data access in `src/app/services/` (e.g., `task.service.ts`, `user.service.ts`)
- **Tauri Integration**: Rust backend in `src-tauri/` for packaging, plugins, and platform features (deep linking, updater, etc.)
- **Authentication**: Google OAuth via Supabase, with deep-linking and shell plugins for mobile auth flows
- **Sync Logic**: See `src/app/synchronization/` for device and cloud sync implementations

## Developer Workflows
- **Install dependencies**: `npm install`
- **Run dev server**: `npm run tauri dev` (desktop)
- **Build app**: `npm run tauri build`
- **Android**: `npm run tauri android init` then `npm run tauri android build`
- **Flatpak**: See README for `flatpak-builder` steps and submodule setup
- **PPA Packaging**: Use `build_and_publish_ppa.sh` for Ubuntu PPA builds

## Conventions & Patterns
- **Services** extend `ServiceAbstract` for CRUD and sync logic, using Dexie tables
- **Entities** use DTOs in `src/app/dto/`
- **User context**: Most data is scoped by `user_uuid` for multi-user/device sync
- **Auth flow**: Mobile uses external browser and deep-link callback (see `auth.service.ts`)
- **Undo/redo**: Implemented via `undo.service.ts` for task actions
- **Notifications**: Desktop notifications via `notification.service.ts`
- **Manual ordering**: Tasks/projects support custom order fields

## Integration Points
- **Supabase**: Online sync and Google OAuth
- **Tauri plugins**: Deep-link, shell, single-instance, updater
- **Platform packaging**: Snap, Flatpak, PPA, Android

## Key Files & Directories
- `src/app/` — Angular app code
- `src/app/services/` — Business logic/services
- `src/app/db/app.db.ts` — Dexie DB schema
- `src/app/synchronization/` — Sync logic
- `src-tauri/` — Tauri config, Rust backend, packaging
- `build_and_publish_ppa.sh` — Ubuntu PPA build script
- `README.md` — Full build, packaging, and platform instructions

## Special Notes
- **Offline-first**: Always design features to work without network; sync is additive
- **Multi-platform**: Test changes on desktop, mobile, and Linux packaging targets
- **Auth edge cases**: Mobile auth flow is non-standard; see README and `auth.service.ts`

---

If any section is unclear or missing, please provide feedback to improve these instructions.
