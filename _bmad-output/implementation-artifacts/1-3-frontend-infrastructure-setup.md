# Story 1.3: Frontend Infrastructure Setup

Status: done

## Story

As a developer,
I want the Vue 3 app configured with Tailwind CSS v4, TanStack Vue Query, Pinia, and a typed API client base,
So that all frontend features have a consistent, configured foundation.

## Acceptance Criteria

1. **Given** `style.css` contains `@import "tailwindcss"`
**When** the frontend app loads
**Then** Tailwind utility classes (e.g. `flex`, `text-sm`, `bg-white`) apply correctly to elements

2. **Given** `main.ts` registers TanStack Vue Query and Pinia
**When** any component calls `useQuery` or `useStore`
**Then** both plugins are available without additional setup in the component

3. **Given** `frontend/src/api/client.ts` wraps `fetch`
**When** called with a relative path (e.g. `/api/todos`)
**Then** it constructs the full URL using `import.meta.env.VITE_API_URL` and returns a typed response or throws a normalised error object `{ code, message }`

4. **Given** `eslint-plugin-vuejs-accessibility` is installed and configured in the frontend ESLint config
**When** `npm run lint` is executed
**Then** accessibility violations in `.vue` files are reported as errors

## Tasks / Subtasks

- [x] Task 1: Install and configure Tailwind CSS v4 (AC: #1)
  - [x] 1.1 Install `tailwindcss` and `@tailwindcss/vite` in the frontend workspace
  - [x] 1.2 Update `frontend/vite.config.ts` to include the `tailwindcss()` Vite plugin
  - [x] 1.3 Replace contents of `frontend/src/assets/main.css` to only contain `@import "tailwindcss";`
  - [x] 1.4 Test by adding a basic utility class (e.g., `text-red-500`) to `App.vue` temporarily

- [x] Task 2: Install and query client state management (AC: #2)
  - [x] 2.1 Install `@tanstack/vue-query`
  - [x] 2.2 Update `frontend/src/main.ts` to register the VueQueryPlugin
  - [x] 2.3 Verify Pinia is already installed and registered (from the Vue scaffold in Story 1.1)

- [x] Task 3: Create typed API client base (AC: #3)
  - [x] 3.1 Create `frontend/src/api/client.ts`
  - [x] 3.2 Implement a fetch wrapper that prefixes requests with `import.meta.env.VITE_API_URL`
  - [x] 3.3 Handle non-2xx responses by parsing the JSON `{ error: { code, message } }` and throwing a typed `ApiError`

- [x] Task 4: Configure ESLint Accessibility Plugin (AC: #4)
  - [x] 4.1 Install `eslint-plugin-vuejs-accessibility` in the frontend workspace
  - [x] 4.2 Update the ESLint config (e.g., `eslint.config.ts` or `eslint.config.js`) to include the accessibility plugin and its recommended rules

## Dev Notes

### Project Structure Considerations
- The Vue 3 app is already scaffolded in the `frontend/` directory from Story 1.1.
- You must run frontend installations strictly inside the `frontend/` workspace (e.g., `npm install <package> -w frontend` or `cd frontend && npm install`).

### Tailwind CSS v4 Configuration
Tailwind v4 is significantly different from v3. **It does NOT use `tailwind.config.js` or `postcss.config.js`.**
It acts as a Vite plugin.

**`vite.config.ts` update:**
```typescript
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    ...(process.env.NODE_ENV === 'development' ? [vueDevTools()] : [])
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
```

**`src/assets/main.css` update:**
Empty everything out of `base.css` and `main.css`. In `main.css`, simply add:
```css
@import "tailwindcss";
```

### Typed API Client Base
The backend responds with this generic error shape (enforced in Story 1.2):
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

Design `client.ts` to catch these rejections and wrap them tightly so Vue Query catches known `ApiError` shapes to power the UI cleanly. Example:
```typescript
export class ApiError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData = { error: { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' } };
    try {
      errorData = await response.json();
    } catch {
      // Revert to fallback if not JSON
    }
    throw new ApiError(
      errorData.error.message, 
      errorData.error.code, 
      response.status
    );
  }

  // Not all 204/2xx responses have bodies (e.g. DELETE)
  if (response.status === 204) return {} as T;
  return response.json();
}
```

### ESLint Accessibility Plugin setup
With the new Flat Config in ESLint 9+ (`eslint.config.ts` generated by create-vue):
```typescript
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'

// In the array of exports:
  ...pluginVueA11y.configs['flat/recommended'],
```
If using older `.eslintrc.cjs`, standard extends strategy applies (`plugin:vuejs-accessibility/recommended`).

## Dev Agent Record

### Agent Model Used

Gemini 3.1 Pro (Preview)

### Debug Log References

- Fixed linter errors caused by unescaped backslashes in `client.ts` creation.
- Addressed an `oxc(const-comparisons)` lint error on logical OR operator evaluations by changing error fallback property access.

### Completion Notes List

- Installed and hooked up `@tailwindcss/vite` in `vite.config.ts`.
- Replaced `main.css` entirely with `@import "tailwindcss";`.
- Installed and hooked up `@tanstack/vue-query`'s `VueQueryPlugin` inside `main.ts`.
- Pinia existed through standard Vite scaffolding.
- Created `frontend/src/api/client.ts` implementing a typed `ApiError` class and standard `fetch` wrapper designed to extract backend json `{ error: { code, message } }` formats gracefully.
- Configured ESLint with Accessibility (`eslint-plugin-vuejs-accessibility`).
- Passed type checking and linting successfully inside frontend workspace.

### File List

- `frontend/package.json` (modified)
- `frontend/vite.config.ts` (modified)
- `frontend/src/assets/main.css` (modified)
- `frontend/src/App.vue` (modified)
- `frontend/src/main.ts` (modified)
- `frontend/src/api/client.ts` (created)
- `frontend/eslint.config.ts` (modified)

### Review Findings

- [x] [Review][Patch] A11y ESLint rules configured as `warn`; AC4 requires `error` severity [eslint.config.ts — `pluginVueA11y.configs['flat/recommended']` sets rules to `warn` by default]
- [x] [Review][Patch] `ApiError` missing `Object.setPrototypeOf` — `instanceof ApiError` fails at runtime [client.ts:6]
- [x] [Review][Patch] Network-level `fetch()` failure not caught — `TypeError` surfaces as untyped rejection instead of `ApiError` [client.ts:14]
- [x] [Review][Patch] Success-path `response.json()` not wrapped in try/catch — `SyntaxError` leaks untyped to callers [client.ts:36]
- [x] [Review][Patch] `VITE_API_URL=''` (empty string) bypasses `||` fallback — requests go to relative path against page origin [client.ts:12]
- [x] [Review][Patch] No leading-slash guard on `endpoint` — caller omitting `/` produces malformed URL (e.g. `http://localhost:3000todos`) [client.ts:fetchApi]
- [x] [Review][Patch] `options.headers` spread when passed as `Headers` instance yields `{}` — all caller-supplied headers silently dropped [client.ts:20]
- [x] [Review][Defer] `vite.config.ts` function-form `defineConfig` breaks `vitest.config.ts` `mergeConfig` typing — Vite sets `process.env.NODE_ENV` correctly in config context; deferred as incompatible with create-vue Vitest integration pattern [vite.config.ts:11]
- [x] [Review][Patch] Vitest ESLint glob only matches `src/**/__tests__/*` — `*.spec.ts` and `*.test.ts` files outside that directory receive no Vitest rule enforcement [eslint.config.ts]
- [x] [Review][Patch] `tailwindcss` and `@tailwindcss/vite` listed in `dependencies` — they are build-time tools and belong in `devDependencies` [package.json]
- [x] [Review][Defer] No `server.proxy` in `vite.config.ts` — design decision; backend CORS configuration covers current dev workflow [vite.config.ts] — deferred, pre-existing
- [x] [Review][Defer] `Content-Type: application/json` set unconditionally — no non-JSON (FormData/binary) use case exists in this story [client.ts:20] — deferred, pre-existing
- [x] [Review][Defer] `{} as T` for 204 responses is a type lie — no consumer today; should become a typed union in a future story [client.ts:35] — deferred, pre-existing
- [x] [Review][Defer] `VueQueryPlugin` registered with no `QueryClient` configuration — framework defaults acceptable for foundation story [main.ts] — deferred, pre-existing
- [x] [Review][Defer] No `app.config.errorHandler` registered — beyond infrastructure story scope [main.ts] — deferred, pre-existing
- [x] [Review][Defer] `App.vue` contains scaffold boilerplate (HelloWorld, /about route) — appropriate to remove in first feature story [App.vue] — deferred, pre-existing
- [x] [Review][Defer] `prettier` pinned to exact version `3.8.3` while other packages use ranges — pre-existing from create-vue scaffold [package.json] — deferred, pre-existing
- [x] [Review][Defer] `format` script uses `--experimental-cli` flag — pre-existing from create-vue scaffold [package.json] — deferred, pre-existing

