# AMT Portal - AnalyzeMyTeam Platform

The complete administrative portal for AnalyzeMyTeam's 12-module championship platform featuring Triangle Defense integration and M.E.L. AI coaching intelligence.

## 🎯 Overview

AMT Portal is the central command center for the AnalyzeMyTeam Platform, providing access to 12 specialized modules for championship-level football analytics and coaching.

### Active Modules
- **Power Playbooks** - Interactive digital playbooks with yard-based animation
- **M.E.L. AI** - Master Intelligence Engine powered by Claude Sonnet 4

### Upcoming Modules (Q2-Q3 2025)
- Executive Suite, Dynamic Fabricator, Game Changer, Q3 Quarterback, Dynamic Predictor, Pro Scout, Recruit, Strength, Medicine, Academics

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS v4
- **State**: Zustand
- **Auth**: JWT with HTTP-only cookies
- **API**: GraphQL Federation (Apollo Client)
- **Backend**: Node.js, GraphQL, Hive Analytics, Supabase, Neo4j

### Project Structure
amt-portal/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (portal)/          # Protected portal routes
│   │   ├── auth/              # Authentication pages
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── portal/            # Portal-specific components
│   │   ├── layout/            # Layout components
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── auth/              # Authentication logic
│   │   ├── graphql/           # GraphQL client & queries
│   │   ├── triangle-defense/  # Triangle Defense utilities
│   │   └── utils/             # Helper functions
│   ├── stores/                # Zustand state management
│   └── types/                 # TypeScript definitions
├── public/                    # Static assets
└── package.json

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Docker (for containerized deployment)
- Azure CLI (for Azure deployment)
- Anthropic API key (for M.E.L. AI features)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/AnalyzeMyTeamHQ/amt-portal.git
cd amt-portal
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
```

4. **Configure your .env.local file:**
```env
# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# AI Integration (M.E.L. AI)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
MEL_MODEL=claude-sonnet-4-20250514

# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Graph Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-neo4j-password

# GraphQL Federation
NEXT_PUBLIC_GRAPHQL_URL=https://graphql.analyzemyteam.com/graphql
HIVE_ANALYTICS_URL=https://hive.analyzemyteam.com

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

5. **Run development server:**
```bash
pnpm dev
```

6. **Open http://localhost:3000 in your browser**

### Demo Credentials
```
Email: denauld@analyzemyteam.com
Password: demo
```

Other admin users:
- courtney@analyzemyteam.com / demo
- mel@analyzemyteam.com / demo
- alexandra@analyzemyteam.com / demo
🔐 Authentication
JWT-based authentication with role-based access control (RBAC):
User Tiers

Founder Authority - Denauld Brown
AI Core - M.E.L.
Executive Command - Courtney Sellars, Alexandra Martinez
Strategic Leadership - Tony Rivera, Derek Thompson
Advisory Council - Dr. Marcus Johnson, Amanda Thompson, Roberto Gutierrez
Innovation Division - Sam Williams, Alex Chen, Marcus Lewis
Football Operations - Michael Rodriguez

Admin Panel Access
Only 4 users have admin panel access:

Denauld Brown (Founder)
Courtney Sellars (CEO/Chief Legal Officer)
M.E.L. (AI Core)
Alexandra Martinez (Chief Administrative Officer)

🎨 Triangle Defense System
The portal implements the complete Triangle Defense methodology:
Formation Classifications

LARRY (MO Left + Male) - #4ECDC4
LINDA (MO Left + Female) - #FF6B6B
RICKY (MO Right + Male) - #FFD93D
RITA (MO Right + Female) - #9B59B6
MALE_MID (MO Middle + Male) - #3498DB
FEMALE_MID (MO Middle + Female) - #E74C3C

Triangle Types

EDGE, BRACKET, SEAL, FUNNEL, WALL, SWARM, TRAP

Defensive Positions

Metro, Apex, Mike, Mac, Star, Solo

📊 GraphQL Integration
The portal connects to AMT's GraphQL Federation:
Data Sources

Hive Analytics (ClickHouse) - Performance metrics
Supabase - Operational database
Neo4j - Graph relationships

Example Query
graphqlquery GetFormations {
  formations(filter: { classification: "LARRY" }) {
    id
    name
    successRate
    triangleRelationships {
      type
      positions
    }
  }
}
🎯 Key Features
M.E.L. Command Interface
Natural language navigation with Triangle Defense awareness:

"Analyze formation Larry vs Cover 3"
"Generate practice plan"
"Create scouting report"

Module Grid
12-module dashboard with status indicators:

Active modules (green)
Beta modules (yellow)
Coming soon modules (gray)

Executive Dashboard
Strategic command center with:

Financial performance metrics
Team efficiency tracking
Module performance overview
Strategic initiatives monitoring

Admin Panel
Restricted control panel for:

User management
Module configuration
System oversight
Activity monitoring

## 🔧 Development

### Build Commands
```bash
# Development server with hot reload
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run integration tests
pnpm test:integration

# Run E2E tests (requires running server)
pnpm test:e2e
```

### API Testing
Test the health check endpoint:
```bash
curl http://localhost:3000/api/health
```

Test M.E.L. AI endpoint:
```bash
curl -X POST http://localhost:3000/api/mel \
  -H "Content-Type: application/json" \
  -d '{"message": "Analyze a LARRY formation"}'
```

Test formations endpoint:
```bash
curl http://localhost:3000/api/formations
```

### Code Quality

- ESLint configuration for Next.js
- Prettier for code formatting
- TypeScript strict mode
- Husky pre-commit hooks
- Automated testing with Jest
- Integration tests for API routes
- Component tests with React Testing Library

## 🚢 Deployment

### Docker Deployment

1. **Build Docker image:**
```bash
docker build -t amt-portal:latest .
```

2. **Run container:**
```bash
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -e ANTHROPIC_API_KEY=your-key \
  -e NEXT_PUBLIC_GRAPHQL_URL=https://graphql.analyzemyteam.com/graphql \
  amt-portal:latest
```

3. **Verify deployment:**
```bash
curl http://localhost:3000/api/health
```

### Azure Deployment

1. **Login to Azure:**
```bash
az login
```

2. **Run deployment script:**
```bash
./scripts/deploy-azure.sh
```

3. **Configure environment variables:**
```bash
az webapp config appsettings set \
  --name amt-portal \
  --resource-group amt-production \
  --settings @azure-env.json
```

4. **Verify deployment:**
```bash
curl https://portal.analyzemyteam.com/api/health
```

### Kubernetes Deployment

1. **Apply manifests:**
```bash
kubectl apply -f k8s/production/
```

2. **Check deployment status:**
```bash
kubectl rollout status deployment/amt-portal -n amt-portal-production
```

3. **View logs:**
```bash
kubectl logs -f deployment/amt-portal -n amt-portal-production
```

### CI/CD Pipeline

The project includes automated CI/CD workflows:

- **CI Pipeline** (.github/workflows/ci.yml):
  - Linting and type checking
  - Build verification
  - Automated testing
  - Docker build test
  - Security scanning

- **Deployment Pipeline** (.github/workflows/deploy.yml):
  - Automated deployments to staging/production
  - Environment variable management
  - Health checks and verification
  - Slack notifications

### Environment Variables Setup

For production deployment, ensure all required environment variables are configured:

**Required:**
- `JWT_SECRET` - JWT signing key
- `ANTHROPIC_API_KEY` - M.E.L. AI API key
- `NEXT_PUBLIC_GRAPHQL_URL` - GraphQL endpoint
- `NEXT_PUBLIC_APP_URL` - Application URL

**Optional but Recommended:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase database URL
- `NEO4J_URI` - Neo4j graph database connection
- `HIVE_ANALYTICS_URL` - Hive analytics endpoint

See `.env.example` for complete list of environment variables.

🎨 Branding
AMT Color Palette
css--amt-red: #e2021a
--amt-accent: #d4db69
--amt-dark: #1b151a
--amt-blue-gray: #4e5064
--amt-very-dark: #1a181a
Typography

Font: Inter (headings and body)
Monospace: JetBrains Mono (code)

📝 Documentation
API Documentation

GraphQL Schema
Authentication Guide
Triangle Defense API

Component Documentation

Component Library
Module Development
State Management

🤝 Contributing
This is a private repository for AnalyzeMyTeam staff only.
Development Workflow

Create feature branch from main
Make changes with descriptive commits
Run tests and linting
Submit pull request for review
Merge after approval

📄 License
Proprietary - AnalyzeMyTeam Platform © 2025
👥 Team
Created by: Denauld Brown - AnalyzeMyTeam
Development Team:

Tier 1-7: 25 Championship Professionals

🆘 Support
For technical support:

Email: support@analyzemyteam.com
Internal Slack: #amt-portal-support

🔄 Changelog
v1.0.0 (Current)

✅ JWT Authentication system
✅ 12 Module pages (2 active, 10 coming soon)
✅ M.E.L. AI command interface
✅ Admin panel (4-user access)
✅ Triangle Defense integration
✅ Executive dashboard
✅ GraphQL federation connectivity

Roadmap

Q2 2025: Dynamic Fabricator launch
Q2 2025: Pro Scout activation
Q3 2025: Full module suite completion
