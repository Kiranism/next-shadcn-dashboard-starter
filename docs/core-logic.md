# Core Logic

## Authentication Flow

### Route Protection

The application uses Clerk middleware to protect routes and manage authentication state.

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
};
```

### Authentication Components

#### Sign In/Sign Up Pages
```typescript
// Sign-in page with GitHub stars integration
export default async function Page() {
  let stars = 3000; // Default value
  
  try {
    const response = await fetch(
      'https://api.github.com/repos/kiranism/next-shadcn-dashboard-starter',
      { next: { revalidate: 86400 } }
    );
    
    if (response.ok) {
      const data = await response.json();
      stars = data.stargazers_count || stars;
    }
  } catch (error) {
    // Error fetching GitHub stars, using default value
  }
  
  return <SignInViewPage stars={stars} />;
}
```

#### User Authentication Form
```typescript
// User auth form with validation
export default function UserAuthForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const [loading, startTransition] = useTransition();
  
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: 'demo@gmail.com' }
  });

  const onSubmit = async (data: UserFormValue) => {
    startTransition(() => {
      console.log('continue with email clicked');
      toast.success('Signed In Successfully!');
    });
  };

  return (
    <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
      <FormInput
        control={form.control}
        name="email"
        label="Email"
        placeholder="Enter your email..."
        disabled={loading}
      />
      <Button disabled={loading} type="submit">
        Continue With Email
      </Button>
    </Form>
  );
}
```

### Session Management

#### Theme Integration
```typescript
// Providers with theme-aware Clerk configuration
export default function Providers({ activeThemeValue, children }) {
  const { resolvedTheme } = useTheme();

  return (
    <ActiveThemeProvider initialTheme={activeThemeValue}>
      <ClerkProvider
        appearance={{
          baseTheme: resolvedTheme === 'dark' ? dark : undefined
        }}
      >
        {children}
      </ClerkProvider>
    </ActiveThemeProvider>
  );
}
```

#### Redirect Handling
- **After Sign In**: Redirects to `/dashboard/overview`
- **After Sign Up**: Redirects to `/dashboard/overview`
- **Protected Routes**: Automatic redirect for unauthenticated users

## Data Fetching Patterns

### Server-Side Data Fetching

#### Product Listing with Search Parameters
```typescript
// Product page with server-side data fetching
export default async function Page(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <Heading
          title="Products"
          description="Manage products (Server side table functionalities.)"
        />
        <Suspense fallback={<DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />}>
          <ProductListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
```

#### Mock API Implementation
```typescript
// Mock products API with realistic behavior
export const fakeProducts = {
  records: [] as Product[],

  async getProducts({ page = 1, limit = 10, categories, search }) {
    await delay(1000); // Simulate network delay
    
    const categoriesArray = categories ? categories.split('.') : [];
    const allProducts = await this.getAll({
      categories: categoriesArray,
      search
    });
    
    const totalProducts = allProducts.length;
    const offset = (page - 1) * limit;
    const paginatedProducts = allProducts.slice(offset, offset + limit);

    return {
      success: true,
      time: new Date().toISOString(),
      message: 'Sample data for testing and learning purposes',
      total_products: totalProducts,
      offset,
      limit,
      products: paginatedProducts
    };
  }
};
```

### Client-Side Data Management

#### Data Table with URL State
```typescript
// Advanced data table hook with URL synchronization
export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [sorting, setSorting] = useQueryState('sort', getSortingStateParser());
  const [filters, setFilters] = useQueryStates(filterParsers);

  const table = useReactTable({
    ...props,
    state: {
      pagination: { pageIndex: page - 1, pageSize: perPage },
      sorting,
      columnFilters: initialColumnFilters,
      columnVisibility,
      rowSelection
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newPagination = updater(pagination);
        void setPage(newPagination.pageIndex + 1);
        void setPerPage(newPagination.pageSize);
      }
    },
    onSortingChange: (updater) => {
      if (typeof updater === 'function') {
        const newSorting = updater(sorting);
        setSorting(newSorting);
      }
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true
  });

  return { table };
}
```

## UI State Management

### Theme Management

#### Theme Provider Configuration
```typescript
// Root layout with theme management
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value;
  const isScaled = activeThemeValue?.endsWith('-scaled');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        'bg-background overflow-hidden overscroll-none font-sans antialiased',
        activeThemeValue ? `theme-${activeThemeValue}` : '',
        isScaled ? 'theme-scaled' : '',
        fontVariables
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <Providers activeThemeValue={activeThemeValue as string}>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### Theme Switching Logic
```typescript
// Theme toggle with persistence
const { resolvedTheme } = useTheme();

// Automatic theme detection
if (localStorage.theme === 'dark' || 
    ((!('theme' in localStorage) || localStorage.theme === 'system') && 
     window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.querySelector('meta[name="theme-color"]')
    .setAttribute('content', '#09090b');
}
```

### Layout State Management

#### Sidebar State Persistence
```typescript
// Dashboard layout with sidebar state
export default async function DashboardLayout({ children }) {
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

### Loading States

#### Suspense Boundaries
```typescript
// Product listing with loading states
<Suspense fallback={<DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />}>
  <ProductListingPage />
</Suspense>
```

#### Parallel Routes for Independent Loading
```typescript
// Overview layout with parallel routes
export default function OverViewLayout({ sales, pie_stats, bar_stats, area_stats }) {
  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">{bar_stats}</div>
        <div className="col-span-4 md:col-span-3">{sales}</div>
        <div className="col-span-4">{area_stats}</div>
        <div className="col-span-4 md:col-span-3">{pie_stats}</div>
      </div>
    </PageContainer>
  );
}
```

## Business Logic Flows

### Product Management

#### Product Form with Validation
```typescript
// Product form with comprehensive validation
const formSchema = z.object({
  image: z.any()
    .refine((files) => files?.length == 1, 'Image is required.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine((files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type), 
            '.jpg, .jpeg, .png and .webp files are accepted.'),
  name: z.string().min(2, { message: 'Product name must be at least 2 characters.' }),
  category: z.string(),
  price: z.number(),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' })
});

export default function ProductForm({ initialData, pageTitle }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      category: initialData?.category || '',
      price: initialData?.price || undefined,
      description: initialData?.description || ''
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    router.push('/dashboard/product');
  }

  return (
    <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
      <FormFileUpload
        control={form.control}
        name="image"
        label="Product Image"
        description="Upload a product image"
        config={{ maxSize: 5 * 1024 * 1024, maxFiles: 4 }}
      />
      {/* Additional form fields */}
    </Form>
  );
}
```

### Task Management (Kanban Board)

#### Zustand Store for Task Management
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
      
      updateCol: (id: UniqueIdentifier, newName: string) =>
        set((state) => ({
          columns: state.columns.map((col) =>
            col.id === id ? { ...col, title: newName } : col
          )
        })),
      
      dragTask: (id: string | null) => set({ draggedTask: id }),
      
      removeTask: (id: string) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id)
        })),
      
      setTasks: (newTasks: Task[]) => set({ tasks: newTasks }),
      setCols: (newCols: Column[]) => set({ columns: newCols })
    }),
    { name: 'task-store', skipHydration: true }
  )
);
```

### Analytics Dashboard

#### Chart Data Processing
```typescript
// Analytics data with parallel loading
export default function OverViewLayout({ sales, pie_stats, bar_stats, area_stats }) {
  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              $1,250.00
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                +12.5%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter>
            <div className="line-clamp-1 flex gap-2 font-medium">
              Trending up this month <IconTrendingUp className="size-4" />
            </div>
          </CardFooter>
        </Card>
        {/* Additional metric cards */}
      </div>
    </PageContainer>
  );
}
```

## Error Handling

### Global Error Boundary
```typescript
// Global error handling with Sentry integration
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
```

### Sentry Configuration
```typescript
// Sentry instrumentation
const sentryOptions: Sentry.NodeOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  spotlight: process.env.NODE_ENV === 'development',
  sendDefaultPii: true,
  tracesSampleRate: 1,
  debug: false
};

export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DISABLED) {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      Sentry.init(sentryOptions);
    }
    if (process.env.NEXT_RUNTIME === 'edge') {
      Sentry.init(sentryOptions);
    }
  }
}
```

## Data Flow Summary

### 1. Authentication Flow
```
User Action → Clerk Middleware → Route Protection → Component Render
```

### 2. Data Fetching Flow
```
Server Component → API Call → Data Processing → Props → Client Component
```

### 3. Form Submission Flow
```
User Input → Validation → Submit → Server Action → Success/Error → UI Update
```

### 4. State Update Flow
```
User Interaction → Hook/Store → State Update → Component Re-render → UI Update
```

### 5. URL State Flow
```
User Interaction → URL Update → State Sync → Component Re-render → UI Update
```

This core logic provides the foundation for all user interactions and data management within the application, ensuring a smooth and predictable user experience.
