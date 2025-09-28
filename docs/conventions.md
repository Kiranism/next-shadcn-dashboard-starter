# Conventions

## Coding Standards

### TypeScript Configuration

#### Strict Mode Settings
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "~/*": ["./public/*"]
    }
  }
}
```

#### Type Safety Guidelines
- **No `any` types**: Use proper typing or `unknown` when necessary
- **Interface over type**: Prefer interfaces for object shapes
- **Generic constraints**: Use proper generic constraints
- **Strict null checks**: Handle null/undefined cases explicitly

### Code Organization

#### File Naming Conventions
```
Component Files:     PascalCase.tsx    (UserProfile.tsx)
Utility Files:       kebab-case.ts     (user-auth-form.tsx)
Hook Files:          kebab-case.ts     (use-data-table.ts)
Type Files:          kebab-case.ts     (data-table.ts)
Constant Files:      kebab-case.ts     (mock-api.ts)
```

#### Import Organization
```typescript
// 1. React imports
import React from 'react';
import { useState, useEffect } from 'react';

// 2. Next.js imports
import { useRouter } from 'next/navigation';
import { cookies } from 'next/headers';

// 3. Third-party libraries
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

// 4. Internal imports (absolute paths)
import { Button } from '@/components/ui/button';
import { useTaskStore } from '@/features/kanban/utils/store';
import { cn } from '@/lib/utils';

// 5. Relative imports (when necessary)
import './styles.css';
```

#### Component Structure
```typescript
// Component file structure
import React from 'react';
// ... other imports

// Types and interfaces
interface ComponentProps {
  title: string;
  description?: string;
}

// Component implementation
export default function Component({ title, description }: ComponentProps) {
  // Hooks
  const [state, setState] = useState();
  
  // Event handlers
  const handleClick = () => {
    // Implementation
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}

// Named exports (if needed)
export { Component };
```

### Component Design Patterns

#### 1. Compound Components
```typescript
// Card component with multiple parts
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
  <CardFooter>
    Actions
  </CardFooter>
</Card>
```

#### 2. Render Props Pattern
```typescript
// Form field with custom rendering
<FormField
  control={control}
  name="field"
  render={({ field }) => (
    <Input {...field} placeholder="Enter value" />
  )}
/>
```

#### 3. Custom Hooks
```typescript
// Reusable stateful logic
export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  
  const table = useReactTable({
    ...props,
    state: { pagination, sorting, columnFilters },
    onPaginationChange: (updater) => {
      // Handle pagination updates
    }
  });
  
  return { table };
}
```

### State Management Conventions

#### 1. Local State (useState)
```typescript
// Simple component state
const [isOpen, setIsOpen] = useState(false);
const [loading, setLoading] = useState(false);
```

#### 2. Global State (Zustand)
```typescript
// Global state with persistence
export const useTaskStore = create<State & Actions>()(
  persist(
    (set) => ({
      tasks: initialTasks,
      addTask: (title: string) => set((state) => ({
        tasks: [...state.tasks, { id: uuid(), title, status: 'TODO' }]
      }))
    }),
    { name: 'task-store', skipHydration: true }
  )
);
```

#### 3. Form State (React Hook Form)
```typescript
// Form with validation
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: initialData
});
```

#### 4. URL State (Nuqs)
```typescript
// URL state management
const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
const [filters, setFilters] = useQueryStates(filterParsers);
```

## Architectural Decisions

### 1. App Router vs Pages Router
**Decision**: App Router (Next.js 13+)
**Rationale**: 
- Better performance with Server Components
- Improved developer experience
- Future-proof architecture
- Enhanced SEO capabilities

### 2. State Management Strategy
**Decision**: Hybrid approach (Zustand + React Hook Form + URL state)
**Rationale**:
- Right tool for the job
- Avoid over-engineering
- Maintain simplicity
- Easy to understand and debug

### 3. Styling Approach
**Decision**: Tailwind CSS + Shadcn/ui
**Rationale**:
- Rapid development
- Consistent design system
- Built-in accessibility
- Easy customization

### 4. Type Safety
**Decision**: Full TypeScript with strict mode
**Rationale**:
- Catch errors early
- Better developer experience
- Improved maintainability
- Self-documenting code

### 5. Authentication Strategy
**Decision**: Clerk for authentication
**Rationale**:
- Production-ready solution
- Security-focused
- Reduces development time
- Multiple sign-in options

### 6. Error Handling
**Decision**: Sentry integration with global error boundary
**Rationale**:
- Production error tracking
- Performance monitoring
- User session replay
- Detailed error reports

## Naming Conventions

### Variables and Functions
```typescript
// camelCase for variables and functions
const userName = 'john_doe';
const isLoading = false;
const handleSubmit = () => {};

// PascalCase for components and types
const UserProfile = () => {};
interface UserData { }
type ProductStatus = 'active' | 'inactive';
```

### Constants
```typescript
// SCREAMING_SNAKE_CASE for constants
const MAX_FILE_SIZE = 5000000;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_PAGE_SIZE = 10;
```

### Files and Directories
```
Components:     PascalCase.tsx     (UserProfile.tsx)
Hooks:         kebab-case.ts      (use-data-table.ts)
Utilities:     kebab-case.ts      (format-date.ts)
Types:         kebab-case.ts      (user-types.ts)
Constants:     kebab-case.ts      (api-constants.ts)
```

### CSS Classes
```typescript
// Tailwind utility classes
className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"

// Custom CSS classes (kebab-case)
className="user-profile-card"
className="data-table-container"
```

## Best Practices

### 1. Component Design
- **Single Responsibility**: One component, one purpose
- **Composition over Inheritance**: Build complex UIs from simple components
- **Accessibility First**: Use semantic HTML and ARIA attributes
- **Performance**: Use React.memo, useMemo, useCallback when appropriate

### 2. State Management Rules
- **Local State**: Component-specific state
- **Global State**: Cross-component shared state
- **URL State**: User navigation and filtering
- **Server State**: Data fetching and caching

### 3. Error Handling
- **Global Error Boundary**: Sentry integration for error tracking
- **Form Validation**: Zod schemas for type-safe validation
- **Loading States**: Suspense boundaries for better UX
- **Graceful Degradation**: Fallback UI for errors

### 4. Performance Optimization
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Regular bundle size monitoring
- **Lazy Loading**: Dynamic imports for heavy components

### 5. Testing Strategy
- **Unit Tests**: Utilities and hooks
- **Integration Tests**: Components with user interactions
- **E2E Tests**: Critical user flows
- **Accessibility Tests**: Screen reader compatibility

## Code Quality Tools

### ESLint Configuration
```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Pre-commit Hooks
```json
// package.json
{
  "lint-staged": {
    "**/*.{js,jsx,tsx,ts,css,less,scss,sass}": [
      "prettier --write --no-error-on-unmatched-pattern"
    ]
  }
}
```

## Development Workflow

### 1. Feature Development
1. Create feature branch from `main`
2. Implement feature with tests
3. Run linting and formatting
4. Create pull request
5. Code review and merge

### 2. Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] Components are accessible
- [ ] Performance considerations addressed
- [ ] Error handling implemented
- [ ] Tests written and passing
- [ ] Documentation updated

### 3. Git Conventions
```bash
# Branch naming
feature/user-authentication
bugfix/login-error
hotfix/security-patch

# Commit messages
feat: add user authentication
fix: resolve login validation error
docs: update API documentation
style: format code with prettier
refactor: simplify user state management
test: add unit tests for auth hooks
```

## Documentation Standards

### 1. Code Comments
```typescript
/**
 * Custom hook for managing data table state with URL synchronization
 * @param props - Configuration options for the data table
 * @returns Object containing table instance and utility functions
 */
export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  // Implementation
}
```

### 2. README Files
- **Component README**: Usage examples and props
- **Feature README**: Business logic and integration
- **API README**: Endpoint documentation

### 3. Type Documentation
```typescript
/**
 * Configuration options for data table
 */
interface UseDataTableProps<TData> {
  /** Table columns configuration */
  columns: ColumnDef<TData>[];
  /** Table data */
  data: TData[];
  /** Total number of pages */
  pageCount: number;
  /** Initial table state */
  initialState?: Partial<TableState>;
}
```

## Security Considerations

### 1. Input Validation
- **Zod schemas**: All form inputs validated
- **Type safety**: TypeScript prevents type errors
- **Sanitization**: Clean user inputs before processing

### 2. Authentication
- **Route protection**: Middleware-based authentication
- **Session management**: Clerk handles session security
- **CSRF protection**: Built-in Next.js protection

### 3. Data Handling
- **Environment variables**: Sensitive data in env files
- **API security**: Proper error handling and validation
- **XSS prevention**: React's built-in XSS protection

This comprehensive set of conventions ensures consistent, maintainable, and high-quality code across the entire application.
