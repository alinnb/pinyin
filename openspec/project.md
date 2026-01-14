# Project Context

## Purpose
A web application for learning Chinese Pinyin. Users practice typing Pinyin (romanized Chinese) with tone marks, receiving immediate feedback on their input accuracy. The app helps learners master the correspondence between Pinyin input and Chinese characters.

## Tech Stack
- **Frontend**: React 19.1.1, TypeScript 5.8.3, Vite 7.1.2
- **Styling**: Tailwind CSS 4.x, class-variance-authority, clsx, tailwind-merge
- **Routing**: React Router 7.11.0
- **Pinyin Processing**: pinyin-pro 3.27.0
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Backend/Deployment**: Cloudflare Workers with Wrangler 4.56.0
- **Build Tool**: Vite with Cloudflare plugin

## Project Conventions

### Code Style
- Strict TypeScript mode with ES2022 target, ESNext modules, react-jsx
- No `any` types - use `unknown` or specific types
- Always annotate function parameters and return types
- Type-only imports for types: `import type { Type } from "library"`
- Import order: third-party → local → relative paths

### Naming Conventions
- PascalCase: Components, types, interfaces
- camelCase: Functions, variables, props
- kebab-case: CSS classes, utility file names
- UPPER_SNAKE_CASE: Constants, env vars

### Components
- Functional components only with forwardRef for reusable UI components
- Props interfaces extend HTML element attributes when appropriate
- Use class-variance-authority (CVA) for component variants
- Use `cn()` utility (clsx + tailwind-merge) for conditional classes

### State Management
- React hooks for local state
- localStorage for persistence
- No global state libraries (Redux/Zustand)

### Error Handling
- Try-catch for localStorage and API calls
- Return graceful fallbacks on errors
- Validate user input with type guards

### Architecture Patterns
```
src/
├── components/
│   ├── ui/        # Reusable UI (shadcn-style)
│   ├── keyboard/  # Business components (keyboard-related)
│   └── practice/  # Feature components (practice flow)
├── lib/           # Utilities (utils.ts, storage.ts, pinyin.ts)
├── pages/         # Route-level components
└── App.tsx        # Main app with routing
```

### Testing Strategy
- No test framework currently configured
- If adding tests, use Vitest

### Git Workflow
- Feature branches for new functionality
- Conventional commits (subject only, no body)
- PRs for merging to main

## Domain Context
- Chinese Pinyin with tone marks (ā, á, ǎ, à, etc.)
- Pinyin input mapping (e.g., "zhong" → "zhōng")
- Tone mark placement rules based on vowel finals
- User keyboard input handling with real-time feedback

## Important Constraints
- Mobile-first responsive design
- Must work offline (localStorage persistence)
- No external API dependencies for core functionality

## External Dependencies
- pinyin-pro library for Pinyin parsing and conversion
- Cloudflare Workers for deployment/hosting
- Local development only (no remote backend services)
