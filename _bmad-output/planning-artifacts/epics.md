---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments: [_bmad-output/planning-artifacts/prd.md, _bmad-output/planning-artifacts/architecture.md]
---

# bmad-todo-app - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad-todo-app, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can create a todo item with a short text description
FR2: User can view all todo items in a single list
FR3: User can delete a todo item permanently
FR4: User can view the creation timestamp of each todo item
FR5: Each todo item has a status drawn from a fixed set of five states: Draft, Ready, In Progress, Backlog, Completed
FR6: User can set a todo's status to any of the five defined states at any time
FR7: New todo items are created with a default status of Draft
FR8: Backlog and Completed are terminal states indicating the task is resolved
FR9: All todo items persist across page refreshes without data loss
FR10: All todo items persist across browser sessions without data loss
FR11: The system maintains data consistency — a todo created must remain retrievable until explicitly deleted
FR12: User can distinguish all five status states visually at a glance without additional interaction
FR13: Active todos (Draft, Ready, In Progress) are visually prominent relative to terminal todos (Backlog, Completed)
FR14: Status is conveyed via text label or icon+label — not colour alone
FR15: The UI displays an empty state when no todos exist
FR16: The UI displays a loading state while data is being fetched
FR17: The UI displays an error state when an API operation fails
FR18: User can add a todo without navigating away from the main list view
FR19: The todo list updates immediately after a create, status change, or delete action — no manual refresh required
FR20: The interface is usable without any onboarding, tutorial, or guidance
FR21: The interface is fully functional on desktop screen sizes
FR22: The interface is fully functional on mobile screen sizes
FR23: The interface is accessible via modern evergreen browsers (Chrome, Firefox, Safari, Edge)
FR24: The system exposes an API endpoint to retrieve all todo items
FR25: The system exposes an API endpoint to create a new todo item
FR26: The system exposes an API endpoint to update a todo item's status
FR27: The system exposes an API endpoint to delete a todo item
FR28: The API returns appropriate error responses when an operation fails
FR29: The API persists todo data durably — data survives server restarts

### NonFunctional Requirements

NFR1: UI actions (create, status change, delete) must feel instantaneous — target round-trip completion under 200ms on standard broadband under normal server load
NFR2: Initial page load must be interactive within 3 seconds on standard broadband
NFR3: The todo list must render without visible degradation at 50+ items
NFR4: The frontend must apply optimistic UI updates — the list reflects the user's action immediately without waiting for API confirmation
NFR5: Zero data loss guarantee — any todo successfully created must persist until explicitly deleted; data must survive page refresh, browser session end, and server restart
NFR6: API failures must not corrupt existing data — failed writes must leave the system in its pre-request state
NFR7: Connectivity loss must surface a visible error state; the application must not silently fail or display stale/incorrect data
NFR8: The UI must meet WCAG 2.1 Level AA compliance
NFR9: All interactive elements must be keyboard navigable
NFR10: Status states must not rely on colour as the sole visual indicator — text label or icon+label required
NFR11: The todo list must be navigable and operable by screen readers

### Additional Requirements

- **Project Initialization (Architecture — Epic 1 Story 1):** Monorepo scaffolded with `frontend/` (via `npm create vue@latest`, selecting TypeScript, Vue Router, Pinia, Vitest, ESLint, Prettier) and `backend/` (manual Fastify + Drizzle setup). Node.js ≥ 20.19.0 required.
- **Backend packages:** `fastify @fastify/cors drizzle-orm @libsql/client dotenv` + dev deps `typescript @types/node tsx drizzle-kit`
- **Tailwind CSS v4:** Installed as `@tailwindcss/vite` Vite plugin; configured via `@import "tailwindcss"` in `style.css` — no `tailwind.config.js` needed
- **TanStack Vue Query:** `@tanstack/vue-query` registered as Vue plugin in `main.ts`; owns all server state via `useQuery`/`useMutation`; optimistic mutations use `onMutate`/`onError`/`onSettled` pattern with cache rollback on failure
- **Pinia store:** `ui.ts` store owns filter and pagination UI state only — NOT server state
- **Data model:** `todos` table — `id` (TEXT UUID, PK), `description` (TEXT NOT NULL), `status` (TEXT enum, default `draft`), `tags` (TEXT CSV, default empty string), `created_at` (INTEGER unix ms), `updated_at` (INTEGER unix ms)
- **Tags serialisation:** All tags stored as CSV string in SQLite; `backend/src/utils/tags.ts` is the single serialise/deserialise point — no other code touches raw tag strings
- **API contract:** All endpoints under `/api/todos`. JSON body uses camelCase; SQLite schema uses snake_case. Error shape: `{ error: { code, message } }`. Endpoints: `GET /api/todos`, `POST /api/todos`, `PATCH /api/todos/:id`, `DELETE /api/todos/:id`
- **Drizzle migrations:** Managed via `drizzle-kit`; migration files live in `backend/drizzle/migrations/`
- **Environment variables:** Frontend: `VITE_API_URL=http://localhost:3000`; Backend: `DB_FILE_NAME=file:local.db`, `ALLOWED_ORIGIN=http://localhost:5173`
- **Accessibility enforcement:** `eslint-plugin-vuejs-accessibility` added to frontend ESLint config to catch WCAG violations at dev time (Architecture validation gap resolution)
- **Root package.json:** Scripts to run both packages concurrently: `dev`, `build`, `test`

### UX Design Requirements

No UX Design document exists for this project. Visual design decisions are captured in the Architecture document (Tailwind CSS v4, status colour/label system, component structure).

### FR Coverage Map

FR1: Epic 2 — Create todo
FR2: Epic 2 — View all todos
FR3: Epic 2 — Delete todo
FR4: Epic 2 — Creation timestamp
FR5: Epic 3 — Five-state status
FR6: Epic 3 — Set any status
FR7: Epic 3 — Default status = Draft
FR8: Epic 3 — Terminal states (Backlog, Completed)
FR9: Epic 2 — Persist across page refresh
FR10: Epic 2 — Persist across browser session
FR11: Epic 2 — Data consistency until deleted
FR12: Epic 3 — Visual distinction of 5 states
FR13: Epic 3 — Active vs terminal visual hierarchy
FR14: Epic 3 — Status via text, not colour alone
FR15: Epic 2 — Empty state
FR16: Epic 2 — Loading state
FR17: Epic 2 — Error state
FR18: Epic 2 — Add todo without navigating away
FR19: Epic 2 — Immediate list update after actions
FR20: Epic 2 — No onboarding required
FR21: Epic 4 — Desktop functional
FR22: Epic 4 — Mobile functional
FR23: Epic 4 — Modern evergreen browsers
FR24: Epic 2 — GET /api/todos
FR25: Epic 2 — POST /api/todos
FR26: Epic 3 — PATCH /api/todos/:id
FR27: Epic 2 — DELETE /api/todos/:id
FR28: Epic 2 — API error responses
FR29: Epic 1 — Data survives server restarts (infrastructure baseline)
NFR1: Epic 4 — UI actions < 200ms
NFR2: Epic 4 — Page load < 3s
NFR3: Epic 4 — Renders 50+ items without degradation
NFR4: Epic 2 — Optimistic UI updates on mutations
NFR5: Epic 2 — Zero data loss guarantee
NFR6: Epic 2 — No data corruption on API failure
NFR7: Epic 2 — Connectivity loss surfaces error state
NFR8: Epic 4 — WCAG 2.1 Level AA compliance
NFR9: Epic 4 — All interactive elements keyboard navigable
NFR10: Epic 4 — Status not conveyed by colour alone
NFR11: Epic 4 — Todo list operable by screen readers

## Epic List

### Epic 1: Project Foundation
Establish a running monorepo with frontend and backend servers wired together, database schema migrated, and all tooling configured — so every subsequent epic can build on a solid, consistent base.
**FRs covered:** FR29
**Additional requirements covered:** Monorepo scaffold, all package installations, Drizzle schema + migration, Fastify server + CORS + error handler, Tailwind v4, TanStack Vue Query + Pinia registered, env files, root dev/test scripts, accessibility ESLint plugin

### Epic 2: Core Todo Operations
Alex can create todos, view them in a list with timestamps, and delete them — and everything persists reliably across page refreshes and sessions.
**FRs covered:** FR1, FR2, FR3, FR4, FR9, FR10, FR11, FR15, FR16, FR17, FR18, FR19, FR20, FR24, FR25, FR27, FR28
**NFRs covered:** NFR4, NFR5, NFR6, NFR7

### Epic 3: Status Workflow
Alex can assign and update a 5-state status on every todo, with clear visual distinction between all states and active vs terminal tasks.
**FRs covered:** FR5, FR6, FR7, FR8, FR12, FR13, FR14, FR26

### Epic 4: Responsive, Accessible, Production-Ready
The app works flawlessly on mobile, meets WCAG 2.1 AA, handles keyboard navigation and screen readers, and performs within all NFR targets.
**FRs covered:** FR21, FR22, FR23
**NFRs covered:** NFR1, NFR2, NFR3, NFR8, NFR9, NFR10, NFR11

### Epic 5: Developer Documentation
A new developer can clone the repository, understand the project's purpose, architecture, and setup steps, and have the app running locally — without needing to ask anyone for help.
**Scope:** Root `README.md` covering project overview, tech stack summary, prerequisites, local setup instructions, available scripts, project structure overview, and links to planning artifacts (PRD, architecture).

---

## Epic 1: Project Foundation

Establish a running monorepo with frontend and backend servers wired together, database infrastructure configured, and all tooling set up — so every subsequent epic can build on a solid, consistent base.

### Story 1.1: Initialize Monorepo Structure

As a developer,
I want the project scaffolded as a monorepo with `frontend/` and `backend/` packages, root scripts, and environment files,
So that the development baseline is consistent and both servers can be started with a single command.

**Acceptance Criteria:**

**Given** the developer has Node.js ≥ 20.19.0 installed
**When** they run `npm install` from the project root
**Then** all dependencies in both `frontend/package.json` and `backend/package.json` are installed

**Given** the developer copies `.env.example` to `.env` in both packages
**When** they run `npm run dev` from the project root
**Then** the Vite dev server starts at `http://localhost:5173` and the Fastify server starts at `http://localhost:3000` concurrently

**Given** the root `package.json` `dev` script
**When** one server crashes
**Then** the other continues running independently

**Given** both `.env.example` files
**When** inspected by a new developer
**Then** all required environment variables are present with documented default values (`VITE_API_URL`, `DB_FILE_NAME`, `ALLOWED_ORIGIN`)

---

### Story 1.2: Backend Server Infrastructure

As a developer,
I want the Fastify server configured with CORS, structured error handling, and a Drizzle database connection,
So that the backend is ready to accept requests from the frontend and write to a persistent SQLite file.

**Acceptance Criteria:**

**Given** the backend `.env` has `DB_FILE_NAME=file:local.db`
**When** the server starts
**Then** a `local.db` SQLite file is created in the backend directory if it does not already exist

**Given** the server is running and `ALLOWED_ORIGIN=http://localhost:5173`
**When** the Vite dev server makes a request
**Then** CORS headers permit the request; a request from any other origin is rejected with a CORS error

**Given** any route receives a request that triggers an unhandled error
**When** the error handler processes it
**Then** the response body is `{ "error": { "code": "<string>", "message": "<string>" } }` with an appropriate HTTP status code

**Given** the Drizzle connection module is loaded
**When** the server starts
**Then** the connection to SQLite is established without errors (logged to console in dev)

---

### Story 1.3: Frontend Infrastructure Setup

As a developer,
I want the Vue 3 app configured with Tailwind CSS v4, TanStack Vue Query, Pinia, and a typed API client base,
So that all frontend features have a consistent, configured foundation.

**Acceptance Criteria:**

**Given** `style.css` contains `@import "tailwindcss"`
**When** the frontend app loads
**Then** Tailwind utility classes (e.g. `flex`, `text-sm`, `bg-white`) apply correctly to elements

**Given** `main.ts` registers TanStack Vue Query and Pinia
**When** any component calls `useQuery` or `useStore`
**Then** both plugins are available without additional setup in the component

**Given** `frontend/src/api/client.ts` wraps `fetch`
**When** called with a relative path (e.g. `/api/todos`)
**Then** it constructs the full URL using `import.meta.env.VITE_API_URL` and returns a typed response or throws a normalised error object `{ code, message }`

**Given** `eslint-plugin-vuejs-accessibility` is installed and configured in the frontend ESLint config
**When** `npm run lint` is executed
**Then** accessibility violations in `.vue` files are reported as errors

---

## Epic 2: Core Todo Operations

Alex can create todos, view them in a list with timestamps, and delete them — and everything persists reliably across page refreshes and sessions.

### Story 2.1: Database Schema and Todo API

As a developer,
I want the `todos` table created via a Drizzle migration and all four API endpoints implemented,
So that the frontend has a complete, tested backend to call for all core todo operations.

**Acceptance Criteria:**

**Given** `npx drizzle-kit migrate` is run against an empty database
**When** the migration completes
**Then** a `todos` table exists with columns: `id` (TEXT UUID, PK), `description` (TEXT NOT NULL), `status` (TEXT, default `draft`), `tags` (TEXT, default `''`), `created_at` (INTEGER unix ms), `updated_at` (INTEGER unix ms)

**Given** a `POST /api/todos` request with body `{ "description": "Buy milk" }`
**When** the route handles it
**Then** a new todo is created with a generated UUID, status `draft`, current `created_at`, and the response returns the full todo object with HTTP 201

**Given** a `GET /api/todos` request
**When** todos exist in the database
**Then** the response returns an array of all todos ordered by `created_at` descending with HTTP 200

**Given** a `DELETE /api/todos/:id` request with a valid id
**When** the route handles it
**Then** the todo is permanently removed from the database and the response returns HTTP 204

**Given** a `DELETE /api/todos/:id` request with a non-existent id
**When** the route handles it
**Then** the response returns HTTP 404 with body `{ "error": { "code": "NOT_FOUND", "message": "Todo not found" } }`

**Given** a `POST /api/todos` request with an empty or missing `description`
**When** Fastify JSON Schema validation runs
**Then** the response returns HTTP 400 with a structured error body (FR28)

**Given** the server is restarted
**When** `GET /api/todos` is called
**Then** all previously created todos are returned unchanged (FR29, NFR5)

---

### Story 2.2: Todo List View with Empty, Loading, and Error States

As Alex,
I want to open the app and immediately see all my todos (or an appropriate state if there are none, data is loading, or an error occurs),
So that I always know the true state of my list without ambiguity.

**Acceptance Criteria:**

**Given** the app loads with no todos in the database
**When** the list renders
**Then** an empty state message is displayed prompting the user to add their first todo (FR15)

**Given** the app is fetching todos from the API
**When** the request is in flight
**Then** a loading indicator is visible and the list area is not blank (FR16)

**Given** the API returns an error (e.g. server offline)
**When** the fetch fails
**Then** an error message is displayed clearly; no stale or incorrect data is shown; the user is not left in a blank state (FR17, NFR7)

**Given** todos exist in the database
**When** the list renders
**Then** each todo row displays: description, status label, and creation timestamp formatted as a human-readable date (FR2, FR4)

**Given** 50+ todos exist
**When** the list renders
**Then** all items render without visible performance degradation (NFR3)

---

### Story 2.3: Create Todo

As Alex,
I want to type a description and add a new todo without leaving the main view,
So that I can capture tasks quickly without interruption.

**Acceptance Criteria:**

**Given** the main view is open
**When** Alex types a description into the input and submits (button click or Enter key)
**Then** the todo appears at the top of the list immediately — before the API response returns (NFR4 optimistic update)

**Given** the optimistic update has been applied and the API call succeeds
**When** the response returns
**Then** the optimistic item is replaced with the server-confirmed todo (no flicker, no duplicate)

**Given** the optimistic update has been applied and the API call fails
**When** the error is received
**Then** the optimistic item is removed from the list, an error message is shown, and the input is restored with the typed text (NFR6)

**Given** Alex submits an empty input
**When** the form validates
**Then** the submit is blocked, no API call is made, and a validation message is shown inline

**Given** Alex adds a todo
**When** the page is refreshed
**Then** the todo is still present in the list (FR9, NFR5)

---

### Story 2.4: Delete Todo

As Alex,
I want to delete a todo permanently,
So that I can remove tasks I no longer need.

**Acceptance Criteria:**

**Given** a todo is visible in the list
**When** Alex activates the delete action on it
**Then** the todo is removed from the list immediately (optimistic update, NFR4)

**Given** the optimistic delete has been applied and the API call succeeds
**When** the 204 response returns
**Then** the todo remains absent from the list

**Given** the optimistic delete has been applied and the API call fails
**When** the error is received
**Then** the todo is restored to its original position in the list and an error message is shown (NFR6)

**Given** Alex refreshes the page after deleting a todo
**When** the list loads
**Then** the deleted todo does not reappear (FR3, NFR5)

---

## Epic 3: Status Workflow

Alex can assign and update a 5-state status on every todo, with clear visual distinction between all states and active vs terminal tasks.

### Story 3.1: Status Update API

As a developer,
I want a `PATCH /api/todos/:id` endpoint that validates and persists status changes,
So that the frontend can update any todo's status to any of the five valid states.

**Acceptance Criteria:**

**Given** a `PATCH /api/todos/:id` request with body `{ "status": "in_progress" }`
**When** the route handles it
**Then** the todo's `status` is updated in the database, `updated_at` is refreshed, and the full updated todo is returned with HTTP 200

**Given** a `PATCH /api/todos/:id` request with an invalid status value (e.g. `{ "status": "done" }`)
**When** Fastify JSON Schema validation runs
**Then** the response returns HTTP 400 with a structured error body — only `draft`, `ready`, `in_progress`, `backlog`, `completed` are accepted (FR5)

**Given** a `PATCH /api/todos/:id` request with a non-existent id
**When** the route handles it
**Then** the response returns HTTP 404 with body `{ "error": { "code": "NOT_FOUND", "message": "Todo not found" } }`

**Given** a todo has its status updated
**When** the server is restarted and `GET /api/todos` is called
**Then** the updated status is returned correctly (NFR5)

---

### Story 3.2: Status Display — StatusBadge Component

As Alex,
I want every todo to display its status as a clearly labelled badge,
So that I can distinguish all five states at a glance without any additional interaction.

**Acceptance Criteria:**

**Given** a todo with any of the five statuses is rendered
**When** the `StatusBadge` component displays it
**Then** the badge shows the status as a human-readable text label (`Draft`, `Ready`, `In Progress`, `Backlog`, `Completed`) — not a raw enum value (FR12, FR14)

**Given** the `StatusBadge` displays statuses
**When** examined for accessibility
**Then** status is conveyed by text label (and optionally colour/icon) — colour is never the sole indicator (FR14, NFR10)

**Given** active todos (`Draft`, `Ready`, `In Progress`) and terminal todos (`Backlog`, `Completed`) are both present
**When** the list renders
**Then** active todos are visually prominent (e.g. higher contrast, bolder label) and terminal todos are visually de-emphasised (e.g. muted colour, lighter weight) (FR13)

---

### Story 3.3: Status Change Interaction

As Alex,
I want to change a todo's status to any of the five states from the todo row,
So that I can move tasks through my workflow without leaving the list.

**Acceptance Criteria:**

**Given** a todo row is visible
**When** Alex interacts with the status control (e.g. dropdown or segmented selector)
**Then** all five status options are presented: `Draft`, `Ready`, `In Progress`, `Backlog`, `Completed` (FR6)

**Given** Alex selects a new status
**When** the change is submitted
**Then** the `StatusBadge` updates immediately to the new status — before the API response returns (NFR4 optimistic update)

**Given** the optimistic status update has been applied and the API call succeeds
**When** the PATCH response returns
**Then** the displayed status matches the server-confirmed value (no flicker)

**Given** the optimistic status update has been applied and the API call fails
**When** the error is received
**Then** the status reverts to its previous value and an error message is shown (NFR6)

**Given** a new todo is created
**When** it appears in the list
**Then** its status badge shows `Draft` (FR7)

**Given** Alex sets a todo to `Backlog` or `Completed`
**When** it renders in the list
**Then** it is visually de-emphasised relative to active todos, consistent with the terminal state styling from Story 3.2 (FR8, FR13)

---

## Epic 4: Responsive, Accessible, Production-Ready

The app works flawlessly on mobile, meets WCAG 2.1 AA, handles keyboard navigation and screen readers, and performs within all NFR targets.

### Story 4.1: Responsive Layout

As Alex,
I want the app to be fully functional on both desktop and mobile screen sizes,
So that I can manage my todos from any device.

**Acceptance Criteria:**

**Given** the app is viewed on a desktop screen (≥ 1024px wide)
**When** the page renders
**Then** the todo list, input form, and all controls are laid out with appropriate spacing and are fully usable (FR21)

**Given** the app is viewed on a mobile screen (≤ 430px wide, e.g. iPhone viewport)
**When** the page renders
**Then** no horizontal scrolling occurs, all text is readable without zooming, all interactive controls (add, delete, status change) are reachable and tappable (FR22)

**Given** the app is opened in Chrome, Firefox, Safari, or Edge (latest 2 major versions)
**When** all features are exercised
**Then** they function correctly with no browser-specific breakage (FR23)

**Given** the app is opened on iOS Safari or Android Chrome
**When** all features are exercised
**Then** they function correctly, including tap targets meeting minimum size (44×44px)

---

### Story 4.2: Keyboard Navigation and Screen Reader Support

As Alex,
I want to operate the entire app using only a keyboard and have all content accessible to screen readers,
So that the app meets WCAG 2.1 AA and is inclusive to all users.

**Acceptance Criteria:**

**Given** a keyboard-only user tabs through the page
**When** they reach every interactive element (add input, submit button, status selector, delete button)
**Then** each element receives a visible focus indicator and is operable via keyboard (Enter/Space) (NFR9)

**Given** a screen reader user navigates the todo list
**When** they move through list items
**Then** each item announces its description, status, and available actions in a meaningful order (NFR11)

**Given** a status change or delete is performed via keyboard
**When** the action completes (or fails)
**Then** the result (success or error) is communicated to screen reader users via an ARIA live region or focus management (NFR8)

**Given** error and empty states are displayed
**When** inspected by a screen reader
**Then** the messages are announced and the context is clear (NFR8)

**Given** `npm run lint` is executed on all `.vue` components
**When** linting completes
**Then** zero `eslint-plugin-vuejs-accessibility` errors are reported (NFR8)

---

### Story 4.3: Performance Validation

As Alex,
I want the app to load quickly and respond instantly to my actions,
So that using it feels effortless rather than sluggish.

**Acceptance Criteria:**

**Given** the app is loaded over standard broadband
**When** measured from navigation start to interactive
**Then** the page is interactive within 3 seconds (NFR2)

**Given** Alex performs a create, status change, or delete action
**When** the optimistic update is applied
**Then** the UI reflects the change within 16ms (one frame) — the perceived response is instant (NFR1)

**Given** 50+ todos are in the list
**When** the list renders or is scrolled
**Then** no jank or layout thrashing is observed; frame rate stays smooth (NFR3)

**Given** the frontend production build is run (`npm run build`)
**When** the build completes
**Then** it succeeds with no errors and the output bundle is served correctly by a static file server

---

## Epic 5: Developer Documentation

A new developer can clone the repository, understand the project's purpose, architecture, and setup steps, and have the app running locally — without needing to ask anyone for help.

### Story 5.1: Project README

As a new developer joining the project,
I want a comprehensive README at the project root,
So that I can understand what the app does, get it running locally, and know where to find further documentation — all without asking anyone.

**Acceptance Criteria:**

**Given** a developer clones the repository for the first time
**When** they read the README
**Then** they understand the app's purpose, the user it is built for, and the core feature set within 2 minutes of reading

**Given** the README's Prerequisites section
**When** a developer checks their environment
**Then** the minimum Node.js version (≥ 20.19.0) and any other required tools are clearly stated

**Given** the README's Local Setup section
**When** followed step by step from a fresh clone
**Then** the developer has both the Vite dev server and Fastify server running locally with no undocumented steps required (clone → install → copy env → migrate → run)

**Given** the README's Available Scripts section
**When** read by a developer
**Then** all root-level scripts (`dev`, `build`, `test`) are listed with a one-line description of what each does

**Given** the README's Project Structure section
**When** read by a developer
**Then** the top-level directory layout (`frontend/`, `backend/`, `_bmad-output/`) is described with brief notes on each area's purpose

**Given** the README's Further Reading section
**When** read by a developer
**Then** links to `_bmad-output/planning-artifacts/prd.md` and `_bmad-output/planning-artifacts/architecture.md` are present and correct
