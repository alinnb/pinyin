<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# AGENTS.md

This file contains guidelines for agentic coding agents working in this repository.

## Project Overview

React + TypeScript + Vite web app for Chinese pinyin learning. Uses Tailwind CSS, Shadcn UI components, and Cloudflare Workers backend.

## Development Commands

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
npm run deploy       # Deploy to Cloudflare Pages/Workers
npm run cf-typegen   # Generate Cloudflare Worker types
```

**No test framework configured.** If adding tests, use Vitest.

## Code Style Guidelines

### TypeScript

- Strict mode enabled
- Target: ES2022 | Module: ESNext | JSX: react-jsx
- Always annotate function parameters and return types
- No `any` types - use `unknown` or specific types instead
- Use generics for reusable components

### Imports

- ES6 imports: `import { Component } from "library"`
- Type-only imports: `import type { Type } from "library"`
- Group order: third-party → local → relative paths

### Naming Conventions

- PascalCase: Components, types, interfaces
- camelCase: Functions, variables, props
- kebab-case: CSS classes, utility file names
- UPPER_SNAKE_CASE: Constants, env vars

### Components

- Functional components only (no class components)
- Use `forwardRef` for UI components
- Props interfaces extend HTML element attributes when appropriate
- Use `class-variance-authority` (CVA) for variants

### Error Handling

- Try-catch for localStorage and API calls
- Return graceful fallbacks on errors
- Validate user input with type guards

### State Management

- React hooks for local state
- localStorage for persistence
- No global state libraries (Redux/Zustand) unless necessary

### Styling

- Tailwind CSS only
- Use `clsx` + `tailwind-merge` (via `cn()`) for conditional classes
- Mobile-first responsive design

## File Organization

```
src/
├── components/
│   ├── ui/        # Reusable UI (shadcn style)
│   ├── keyboard/  # Business components
│   └── practice/  # Feature components
├── lib/           # Utilities (utils.ts, storage.ts, pinyin.ts)
├── pages/         # Route-level components
└── App.tsx        # Main app with routing
```

## Component Pattern

```typescript
interface Props extends HTMLAttributes<HTMLDivElement> {
  // Custom props
}

export const Component = forwardRef<HTMLDivElement, Props>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-styles", className)} {...props}>
        {/* content */}
      </div>
    );
  }
);
Component.displayName = "Component";
```

## Workflow

Before changes: Read existing code, run `npm run lint`
After changes: `npm run lint` → `npm run build` → manual test

## Tech Stack

- React 19.1.1, TypeScript 5.8.3, Vite 7.1.2
- Tailwind CSS 4.x, React Router 7.11.0
- pinyin-pro 3.27.0, Lucide React, Sonner, CVA
- Cloudflare Workers + Wrangler 4.56.0

请用中文
