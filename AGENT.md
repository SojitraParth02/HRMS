# Full-Stack Engineering Standards & Architecture

This repository follows a strict Full-Stack Monorepo architecture containing both Backend (Express + TypeScript + Mongoose) and Frontend (Next.js + TanStack Query + Redux Toolkit).

---

## 1. Global Coding & Quality Rules
- **TypeScript Strictness**: Strictly NO `any` and NO `unknown` types across both backend and frontend. Every parameter, response, slice, and DTO must be explicitly typed using interfaces or types.
- **Centralized Types Organization**: All TypeScript interfaces, types, DTOs, request payloads, and response models must be declared inside dedicated domain files in `src/types/` (e.g., `src/types/auth.types.ts`). Never declare domain types directly inside service, controller, repository, slice, hook, or component files. Always import them from `src/types/`.
- **Centralized Icons System**: All UI icons across the frontend (in Sidebar, Topbar, Dashboard, Auth forms, etc.) must be declared and exported centrally from `src/components/icons.tsx`. Never write raw, one-off inline `<svg>` icon elements directly inside individual components or pages. Always import centralized icon components from `src/components/icons.tsx`.
- **Layer Isolation**: Respect architectural boundaries. Never bypass layers (e.g., Controllers must never touch Models directly; Frontend UI must never call raw fetch directly).
- **ESLint Cleanliness**: Adhere strictly to ESLint rules with zero lint errors or warnings.
- **API Documentation Synchronization**: Whenever any new API route is created, updated, or removed, always update the simple list of API routes in `README.md` (Method + Path + Auth status).

---

## 2. Backend Architecture (4-Tier Layered Flow)
All API endpoints must strictly follow this unidirectional flow:
1. **Server (`server.ts`)**: Global middlewares (cors, express.json, cookieParser), DB initialization, centralized error handling.
2. **Routes (`src/routes/*.routes.ts`)**: Route definitions and path parameters.
3. **Middleware (`src/middleware/*.middleware.ts`)**: JWT verification, session checks, and role authorization.
4. **Controllers (`src/controllers/*.controller.ts`)**: Extracts req.body, req.query, req.params, req.user; passes data to services; sends HTTP responses. Never calls Repositories or Models directly.
5. **Services (`src/services/*.service.ts`)**: Core business logic, validations, activity logs, error throwing.
6. **Repositories (`src/repositories/*.repository.ts`)**: Direct database Mongoose queries (`find`, `save`, `aggregate`, `populate`).
7. **Models (`src/models/*.model.ts`)**: Mongoose schema and type definitions.

### Backend Structure
```text
backend/src/
├── config/          # Database & environment configurations
├── routes/          # Express route definitions
├── middleware/      # Auth, role checks, validation middlewares
├── controllers/     # Request/Response handlers
├── services/        # Business logic & validations
├── repositories/    # Database query layer (Mongoose)
├── models/          # Mongoose schemas & interfaces
├── types/           # Shared TypeScript interfaces & types
└── server.ts        # App initialization & global middleware
```

---

## 3. Frontend Architecture (Next.js App Router + Redux Toolkit)
- **Framework**: Next.js (App Router `src/app/`)
- **Server State Management**: `@tanstack/react-query` (API fetching, caching, mutations)
- **Client Global State**: Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
- **Styling**: Tailwind CSS

### Frontend Data Flow Rules
1. **State Separation**:
   - **Server State (API Data)**: Managed strictly via TanStack React Query inside `src/hooks/queries/`. Never duplicate server API data in Redux slices.
   - **Client State (Session/UI)**: Managed via Redux Toolkit inside `src/store/slices/` (e.g., auth tokens, theme, modals). Always use typed hooks: `useAppDispatch` and `useAppSelector` from `src/hooks/redux.ts`.
2. **Centralized API Client**:
   - All HTTP requests must go through `src/services/apiClient.ts` with automatic JWT Bearer token attachment and 401 handling. Never write raw `fetch()` inside components.
3. **Domain Components**:
   - Organize UI into domain folders inside `src/components/` (e.g., `components/common/`, `components/auth/`).
4. **Centralized Icons Usage**:
   - Every icon used across UI layouts, pages, and navigation must be imported from `src/components/icons.tsx`. No inline `<svg>` icons in page/component files.

### Frontend Structure
```text
frontend/src/
├── app/                  # Next.js App Router pages and layouts
├── components/           # Domain-driven UI components
├── hooks/
│   ├── queries/          # TanStack React Query custom hooks
│   └── redux.ts          # Typed Redux hooks (useAppDispatch, useAppSelector)
├── services/             # apiClient.ts & domain API call services
├── store/                # Redux store & slices (src/store/slices/)
├── types/                # TypeScript interface & type definitions
├── utils/                # Helper utilities (formatters, date/currency helpers)
└── providers/            # Redux Provider & React Query Provider wrappers
```