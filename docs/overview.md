# Project Overview

## Purpose

This is a modern Next.js 15 dashboard starter template designed to accelerate the development of admin interfaces and business applications. The project provides a production-ready foundation with authentication, data management, analytics, and task management capabilities.

### Key Features
- **Admin Dashboard**: Complete dashboard interface with analytics and metrics
- **Authentication System**: Secure user authentication with multiple sign-in options
- **Product Management**: Full CRUD operations with advanced data tables
- **Task Management**: Drag-and-drop Kanban board for project management
- **User Profiles**: Account management and settings
- **Responsive Design**: Mobile-first, accessible UI components
- **Error Tracking**: Integrated error monitoring and reporting

## Tech Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.3.2 | React framework with App Router, Server Components, and Turbopack |
| **React** | 19.0.0 | UI library with concurrent features and latest optimizations |
| **TypeScript** | 5.7.2 | Type-safe JavaScript with strict mode |

### UI & Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 4.0.0 | Utility-first CSS framework with CSS variables |
| **Shadcn/ui** | Latest | Accessible component library built on Radix UI |
| **Radix UI** | Latest | Headless UI primitives for accessibility |
| **Lucide React** | 0.476.0 | Icon library for consistent iconography |
| **Tabler Icons** | 3.31.0 | Additional icon set for UI elements |

### State Management & Forms
| Technology | Version | Purpose |
|------------|---------|---------|
| **Zustand** | 5.0.2 | Lightweight global state management |
| **React Hook Form** | 7.54.1 | Form state management with validation |
| **Zod** | 4.1.8 | Schema validation and type inference |
| **Nuqs** | 2.4.1 | Type-safe URL state management |

### Data & Tables
| Technology | Version | Purpose |
|------------|---------|---------|
| **TanStack Table** | 8.21.2 | Advanced table functionality with sorting, filtering, pagination |
| **Recharts** | 2.15.1 | Data visualization and charting library |
| **Faker.js** | 9.3.0 | Mock data generation for development |

### Authentication & Security
| Technology | Version | Purpose |
|------------|---------|---------|
| **Clerk** | 6.12.12 | Complete authentication solution with social logins |
| **Sentry** | 9.19.0 | Error tracking and performance monitoring |
| **Next.js Middleware** | Built-in | Route protection and authentication |

### Development Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 8.48.0 | Code linting with Next.js rules |
| **Prettier** | 3.4.2 | Code formatting and style consistency |
| **Husky** | 9.1.7 | Git hooks for pre-commit checks |
| **pnpm** | Latest | Fast, disk space efficient package manager |

### Additional Features
| Technology | Version | Purpose |
|------------|---------|---------|
| **DnD Kit** | 6.3.1 | Drag and drop functionality for Kanban board |
| **Kbar** | 0.1.0-beta.45 | Command palette interface (Cmd+K) |
| **Next Themes** | 0.4.6 | Dark/light mode theme switching |
| **Sonner** | 1.7.1 | Toast notifications |

## Folder Structure

The project follows a **feature-based architecture** with clear separation of concerns:

```
src/
├── app/                          # Next.js App Router
│   ├── auth/                     # Authentication routes
│   │   ├── sign-in/             # Sign-in page
│   │   └── sign-up/             # Sign-up page
│   ├── dashboard/                # Protected dashboard routes
│   │   ├── overview/            # Analytics dashboard
│   │   │   ├── @area_stats/     # Parallel route for area charts
│   │   │   ├── @bar_stats/      # Parallel route for bar charts
│   │   │   ├── @pie_stats/      # Parallel route for pie charts
│   │   │   └── @sales/          # Parallel route for sales data
│   │   ├── product/             # Product management
│   │   │   └── [productId]/     # Dynamic product pages
│   │   ├── profile/             # User profile management
│   │   └── kanban/              # Task management board
│   ├── layout.tsx               # Root layout with providers
│   ├── globals.css              # Global styles
│   └── theme.css                # Theme variables
│
├── components/                   # Shared UI components
│   ├── ui/                      # Base UI components (Shadcn)
│   │   ├── button.tsx          # Button component
│   │   ├── card.tsx            # Card component
│   │   ├── form.tsx            # Form components
│   │   ├── table/              # Data table components
│   │   └── ...                 # Other UI components
│   ├── layout/                 # Layout components
│   │   ├── app-sidebar.tsx     # Main navigation sidebar
│   │   ├── header.tsx          # Top navigation header
│   │   ├── providers.tsx        # Context providers
│   │   └── ThemeToggle/        # Theme switching components
│   ├── forms/                  # Form-specific components
│   │   ├── form-input.tsx      # Input field wrapper
│   │   ├── form-select.tsx     # Select field wrapper
│   │   └── ...                 # Other form components
│   ├── kbar/                   # Command palette components
│   └── icons.tsx               # Icon components
│
├── features/                    # Feature-based modules
│   ├── auth/                   # Authentication feature
│   │   └── components/         # Auth-specific components
│   ├── products/               # Product management feature
│   │   ├── components/         # Product components
│   │   └── product-tables/     # Data table components
│   ├── kanban/                 # Task management feature
│   │   ├── components/         # Kanban board components
│   │   └── utils/              # Kanban utilities and store
│   ├── overview/               # Analytics dashboard
│   │   └── components/         # Chart and metric components
│   └── profile/                # User profile feature
│       ├── components/         # Profile components
│       └── utils/              # Profile utilities
│
├── hooks/                      # Custom React hooks
│   ├── use-data-table.ts       # Data table hook
│   ├── use-debounce.tsx        # Debouncing hook
│   ├── use-mobile.tsx          # Mobile detection hook
│   └── ...                     # Other custom hooks
│
├── lib/                        # Core utilities and configurations
│   ├── utils.ts                # Utility functions
│   ├── font.ts                 # Font configuration
│   ├── format.ts               # Data formatting utilities
│   ├── parsers.ts              # URL parameter parsers
│   └── searchparams.ts         # Search parameter utilities
│
├── types/                      # TypeScript type definitions
│   ├── index.ts                # Main type exports
│   ├── data-table.ts           # Data table types
│   └── base-form.ts            # Form types
│
├── constants/                   # Application constants
│   ├── data.ts                 # Static data
│   └── mock-api.ts             # Mock API implementation
│
├── middleware.ts               # Next.js middleware for auth
├── instrumentation.ts          # Sentry instrumentation
└── instrumentation-client.ts   # Client-side Sentry setup
```

### Key Directory Explanations

#### `/app` - Next.js App Router
- **Route-based organization**: Each folder represents a route
- **Parallel routes**: `@` prefixed folders for parallel rendering
- **Layout nesting**: Nested layouts for different sections
- **Server Components**: Default server-side rendering

#### `/components` - Shared Components
- **UI components**: Reusable Shadcn/ui components
- **Layout components**: Navigation, headers, sidebars
- **Form components**: Wrapper components for form fields
- **Feature components**: Business logic components

#### `/features` - Feature Modules
- **Self-contained**: Each feature has its own components and utilities
- **Domain-driven**: Organized by business domain
- **Scalable**: Easy to add new features without affecting others

#### `/hooks` - Custom Hooks
- **Reusable logic**: Stateful logic that can be shared
- **Composition**: Build complex functionality from simple hooks
- **Testing**: Easy to unit test in isolation

#### `/lib` - Core Utilities
- **Pure functions**: Utility functions without side effects
- **Configuration**: App-wide settings and configurations
- **Type-safe**: All utilities are fully typed

## Getting Started

### Prerequisites
- **Node.js**: 18.17 or later
- **pnpm**: Package manager (recommended)
- **Git**: Version control

### Quick Start
```bash
# Clone the repository
git clone https://github.com/Kiranism/next-shadcn-dashboard-starter.git
cd next-shadcn-dashboard-starter

# Install dependencies
pnpm install

# Set up environment
cp env.example.txt .env.local
# Edit .env.local with your configuration

# Start development server
pnpm dev
```

### Environment Setup
The project includes comprehensive environment configuration for:
- **Authentication**: Clerk API keys and redirect URLs
- **Error Tracking**: Sentry DSN and project configuration
- **Development**: Optional settings for local development

Visit `http://localhost:3000` to see the application in action!
