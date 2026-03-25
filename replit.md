# Task Management Application

## Overview

This is a full-stack task management application built with React, Express, and TypeScript. The application allows users to create, update, filter, and delete tasks with a clean, modern UI built using shadcn/ui components. The architecture follows a monorepo pattern with shared types between frontend and backend, currently using in-memory storage with the infrastructure ready for PostgreSQL database integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite for fast development and optimized production builds
- **Routing:** Wouter for lightweight client-side routing
- **State Management:** TanStack Query (React Query) for server state management
- **UI Components:** Material Design components with Bootstrap table
- **Styling:** Material Design styling system with Tailwind CSS and custom CSS variables

**Design Patterns:**
- Component-based architecture with reusable UI components in `client/src/components/ui/`
- Custom hooks pattern for shared logic (`use-toast`, `use-mobile`)
- Centralized API client with query client configuration
- Form validation using Zod schemas shared with backend

**Key Frontend Decisions:**
- **Query Client Configuration:** Disabled automatic refetching and set infinite stale time to reduce unnecessary network requests. This gives explicit control over when data is refreshed.
- **Design System:** Adopts Material Design principles with Roboto typography, elevation shadows, and Material color palette (Indigo 500 primary). Bootstrap table component retained for task list display.
- **Material Design Implementation:**
  - **Typography:** Roboto font family (Material Design standard)
  - **Colors:** Material Indigo 500 (rgb(63, 81, 181)) primary, Material Red destructive
  - **Elevation:** Material Design shadow system (md-elevation-1, -2, -4, -8)
  - **Components:** Material Design buttons with raised elevation, checkboxes with proper state transitions
  - **Table:** Bootstrap 4.0 default table styling preserved for task list
- **Path Aliases:** Configured `@/` for client code and `@shared/` for shared types to simplify imports across the application.

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js for RESTful API
- **Database ORM:** Drizzle ORM configured for PostgreSQL
- **Validation:** Zod schemas for request validation
- **Development:** tsx for TypeScript execution in development

**API Design:**
- RESTful endpoints under `/api` prefix
- Standard HTTP methods (GET, POST, PATCH, DELETE)
- Consistent error handling with appropriate status codes
- JSON request/response format

**Storage Architecture:**
- **Current Implementation:** In-memory storage using `MemStorage` class that implements `IStorage` interface
- **Design Decision:** Storage abstraction layer allows easy swapping between in-memory and database implementations without changing route handlers
- **Future-Ready:** Drizzle ORM configured and schema defined for PostgreSQL migration when needed

**Middleware Stack:**
- JSON body parsing with raw body preservation for webhook support
- URL-encoded form data parsing
- Request/response logging for API endpoints
- Vite integration for HMR in development

### Data Schema

**Group Entity:**
```typescript
{
  id: string (UUID)
  name: string (required)
  description: string (optional, defaults to "")
  createdAt: timestamp (auto-generated)
}
```

**Task Entity:**
```typescript
{
  id: string (UUID)
  title: string (required)
  description: string (optional, defaults to "")
  completed: boolean (defaults to false)
  category: string (optional, one of: Work, Personal, Shopping, Health, Other)
  deadline: timestamp (optional, nullable)
  groupId: string (optional, nullable, references a group)
  quadrant: integer (optional, nullable, 1-4 for Eisenhower Matrix)
  createdAt: timestamp (auto-generated)
}
```

**Eisenhower Matrix Quadrants:**
- Q1: Do First — Important & Urgent (red)
- Q2: Schedule — Important, Not Urgent (blue)
- Q3: Delegate — Not Important, Urgent (yellow)
- Q4: Don't Do — Not Important, Not Urgent (gray)

**Validation Strategy:**
- Shared Zod schemas between frontend and backend via `shared/schema.ts`
- `insertTaskSchema` for create operations (omits auto-generated fields)
- Type inference using Drizzle's `$inferSelect` for type safety

### External Dependencies

**Database:**
- **Neon Serverless PostgreSQL:** Configured via `@neondatabase/serverless` package
- **Connection:** Environment variable `DATABASE_URL` required for database operations
- **Migrations:** Managed through Drizzle Kit with migrations in `./migrations` directory
- **Current Status:** Schema defined but using in-memory storage; ready for database activation

**UI Component Libraries:**
- **Material Design:** Google Material Design styling system with Roboto font and Material Icons
- **Bootstrap 4.0:** Table component for task list display
- **Lucide React:** Icon library for consistent iconography
- **Tailwind CSS:** Utility-first CSS framework with Material Design color tokens

**Development Tools:**
- **Replit Integrations:** Vite plugins for error overlay, cartographer, and dev banner (development only)
- **TypeScript:** Strict mode enabled for type safety
- **ESBuild:** Used for production server bundling

**Form & State Management:**
- **React Hook Form:** Form state management with `@hookform/resolvers` for Zod integration
- **TanStack Query:** Server state caching and synchronization
- **date-fns:** Date formatting and manipulation utilities

**Session Management:**
- **connect-pg-simple:** PostgreSQL session store (configured but not actively used in current implementation)