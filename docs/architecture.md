# Architecture

## System Organization

The application follows a **layered architecture** with clear separation of concerns, designed for scalability and maintainability.

### Architectural Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   UI Components │  │  Feature Comps  │  │   Layouts   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │  Route Handlers │  │ Server Components│  │Client Comps │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ Feature Modules │  │  Custom Hooks    │  │   Stores    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Utilities     │  │   Mock APIs     │  │   Types     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Key Layers & Modules

### 1. Presentation Layer (`/components`, `/features`)

#### UI Components (`/components/ui`)
- **Shadcn/ui Components**: Accessible, customizable UI primitives
- **Form Components**: Wrapper components for form fields
- **Layout Components**: Navigation, headers, sidebars
- **Data Table Components**: Advanced table functionality

```typescript
// Example: Button component with variants
export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

#### Feature Components (`/features`)
- **Self-contained modules**: Each feature has its own components
- **Business logic**: Domain-specific functionality
- **Reusable**: Components can be shared across features

### 2. Application Layer (`/app`)

#### Route Organization
- **File-based routing**: Next.js App Router structure
- **Nested layouts**: Hierarchical layout system
- **Parallel routes**: Independent loading and error handling
- **Server Components**: Default server-side rendering

```typescript
// Example: Dashboard layout with sidebar
export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <Header />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
```

#### Server vs Client Components
- **Server Components**: Default for data fetching and static content
- **Client Components**: Interactive UI with state and event handlers
- **Hybrid approach**: Optimal performance and user experience

### 3. Business Logic Layer (`/features`, `/hooks`)

#### Feature Modules
- **Domain-driven design**: Organized by business domain
- **Encapsulation**: Each feature contains its own logic
- **Scalability**: Easy to add new features

#### Custom Hooks
- **Reusable logic**: Stateful logic that can be shared
- **Composition**: Build complex functionality from simple hooks
- **Testing**: Easy to unit test in isolation

```typescript
// Example: Data table hook with URL state
export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [sorting, setSorting] = useQueryState('sort', getSortingStateParser());
  
  const table = useReactTable({
    ...props,
    state: { pagination, sorting, columnFilters },
    onPaginationChange: (updater) => {
      // Handle pagination updates
    },
    onSortingChange: (updater) => {
      // Handle sorting updates
    },
  });
  
  return { table };
}
```

### 4. Data Layer (`/lib`, `/constants`)

#### Utilities (`/lib`)
- **Pure functions**: No side effects, easy to test
- **Type-safe**: Full TypeScript support
- **Reusable**: Shared across the application

#### Mock APIs (`/constants`)
- **Development data**: Realistic mock data for development
- **API simulation**: Simulates real backend behavior
- **Configurable**: Easy to modify for different scenarios

## Dependencies & Integrations

### Core Dependencies

#### Next.js Ecosystem
```json
{
  "next": "15.3.2",
  "react": "19.0.0",
  "react-dom": "19.0.0",
  "typescript": "5.7.2"
}
```

#### UI & Styling Stack
```json
{
  "@tailwindcss/postcss": "^4.0.0",
  "tailwindcss": "^4.0.0",
  "tailwindcss-animate": "^1.0.7",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.0.2"
}
```

#### State Management Stack
```json
{
  "zustand": "^5.0.2",
  "react-hook-form": "^7.54.1",
  "zod": "^4.1.8",
  "nuqs": "^2.4.1"
}
```

#### Data & Tables
```json
{
  "@tanstack/react-table": "^8.21.2",
  "recharts": "^2.15.1",
  "@faker-js/faker": "^9.3.0"
}
```

### Integration Patterns

#### Authentication Integration
```typescript
// Clerk middleware for route protection
export default clerkMiddleware(async (auth, req: NextRequest) => {
  const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);
  if (isProtectedRoute(req)) await auth.protect();
});
```

#### Error Tracking Integration
```typescript
// Sentry configuration
const sentryOptions: Sentry.NodeOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  debug: false
};
```

#### Theme Integration
```typescript
// Theme provider with persistence
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  <ClerkProvider appearance={{ baseTheme: resolvedTheme === 'dark' ? dark : undefined }}>
    {children}
  </ClerkProvider>
</ThemeProvider>
```

## State Management Summary

### State Architecture Overview

The application uses a **hybrid state management approach** combining multiple strategies:

#### 1. Global State (Zustand)
```typescript
// Kanban board state management
export const useTaskStore = create<State & Actions>()(
  persist(
    (set) => ({
      tasks: initialTasks,
      columns: defaultCols,
      draggedTask: null,
      addTask: (title: string, description?: string) => 
        set((state) => ({
          tasks: [...state.tasks, { id: uuid(), title, description, status: 'TODO' }]
        })),
    }),
    { name: 'task-store', skipHydration: true }
  )
);
```

**Use Cases:**
- Kanban board state (tasks, columns, drag state)
- User preferences and settings
- Cross-component shared state

#### 2. URL State (Nuqs)
```typescript
// Data table state in URL
const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
const [sorting, setSorting] = useQueryState('sort', getSortingStateParser());
const [filters, setFilters] = useQueryStates(filterParsers);
```

**Use Cases:**
- Data table filters, sorting, pagination
- Search parameters
- Shareable URLs with state

#### 3. Form State (React Hook Form)
```typescript
// Form with validation
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: initialData
});
```

**Use Cases:**
- Form inputs and validation
- Product creation/editing
- User profile management

#### 4. Server State (Next.js)
```typescript
// Server-side data fetching
export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const data = await getProducts(searchParams);
  return <ProductListing data={data} />;
}
```

**Use Cases:**
- Initial page data
- Server-side rendering
- Static generation

### Data Flow Patterns

#### 1. Server-to-Client Data Flow
```
Server Component → Props → Client Component → Local State
```

#### 2. Client State Updates
```
User Action → Hook/Store → State Update → UI Re-render
```

#### 3. Form Submission Flow
```
Form Input → Validation → Submit → Server Action → Success/Error
```

#### 4. URL State Synchronization
```
User Interaction → URL Update → State Sync → Component Re-render
```

## Component Architecture

### Component Hierarchy

```
App Layout
├── Theme Provider
├── Clerk Provider
├── Nuqs Adapter
├── Dashboard Layout
│   ├── Sidebar Provider
│   ├── App Sidebar
│   └── Sidebar Inset
│       ├── Header
│       └── Page Content
└── Global Error Boundary
```

### Component Patterns

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
// Data table with custom rendering
<DataTable
  columns={columns}
  data={data}
  renderCell={(cell) => <CustomCell {...cell} />}
/>
```

#### 3. Higher-Order Components
```typescript
// Form wrapper with validation
<FormProvider>
  <FormField
    control={control}
    name="field"
    render={({ field }) => <Input {...field} />}
  />
</FormProvider>
```

## Performance Optimizations

### Code Splitting
- **Automatic**: Next.js handles code splitting by default
- **Dynamic imports**: Lazy loading for heavy components
- **Route-based**: Each route is automatically split

### Caching Strategies
- **Static Generation**: Pre-rendered pages for performance
- **Server Components**: Reduced client-side JavaScript
- **Image Optimization**: Next.js Image component with automatic optimization

### Bundle Optimization
- **Tree Shaking**: Unused code elimination
- **Turbopack**: Fast builds in development
- **Bundle Analysis**: Regular monitoring of bundle size

This architecture provides a solid foundation for building scalable, maintainable web applications with modern React patterns and Next.js best practices.
