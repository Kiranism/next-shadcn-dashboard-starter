AMT Dashboard - Azure Deployment Package
📦 Package Contents
This deployment package contains everything needed to deploy the AMT Dashboard to Azure Container Apps.
Files Included

deploy-amt-dashboard.sh - Main deployment script
configure-secrets.sh - Secrets configuration script
verify-deployment.sh - Post-deployment verification
.env.azure.template - Environment variables template
DEPLOYMENT_README.md - Comprehensive deployment guide

🚀 Quick Start (5 Minutes)
Step 1: Configure Environment
bash# Copy template and edit with your values
cp .env.azure.template .env.azure
nano .env.azure

# Required values:
# - JWT_SECRET
# - ANTHROPIC_API_KEY  
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - NEO4J_URI
# - NEO4J_PASSWORD
Step 2: Login to Azure
bashaz login
az account set --subscription "Azure subscription 1"
Step 3: Deploy
bashchmod +x *.sh
./deploy-amt-dashboard.sh
Step 4: Configure Secrets
bash./configure-secrets.sh
Step 5: Verify
bash./verify-deployment.sh
🎯 What Gets Deployed
Azure Resources Created/Updated

Container App: amt-dashboard

Next.js 15 application
Auto-scaling (0-10 replicas)
External ingress on port 3000


Container Image: dbcamtregistry.azurecr.io/amt-dashboard:latest

Multi-stage Docker build
Production optimized
Platform: linux/amd64



Executive Bot Onboarding
Three-step introduction sequence for new users:

Alexandra Martinez (Chief Administrative Officer)

Welcome and platform introduction
8-second introduction


Courtney Sellars (CEO/Chief Legal Officer)

Legal and security overview
8-second introduction


Denauld Brown (Founder, CEO & Defensive Coordinator)

Triangle Defense welcome
10-second introduction



Integrations

✅ GraphQL Federation (graphql.analyzemyteam.com)
✅ Supabase Real-time Database
✅ Neo4j Triangle Defense Graph
✅ M.E.L. AI Service (mel-service)
✅ HubSpot CRM (optional)
✅ Sentry Error Tracking (optional)

📊 Architecture
GitHub Repository
  ↓
Azure Container Registry (dbcamtregistry)
  ↓
Azure Container Apps (amt-dashboard)
  ├─→ GraphQL Federation
  ├─→ Supabase
  ├─→ Neo4j
  └─→ M.E.L. Service

Existing Infrastructure:
├── amt-production (Resource Group) ✅
├── managedEnvironment-amtproduction-b6cb ✅
├── workspaceamtproduction9838 (Log Analytics) ✅
└── mel-service (Container App) ✅
🔐 Security
Secrets Management
All sensitive values are stored as Azure Container App secrets:

jwt-secret - JWT authentication key
anthropic-key - Anthropic API key for M.E.L.
supabase-url - Supabase project URL
supabase-anon-key - Supabase anonymous key
neo4j-uri - Neo4j database URI
neo4j-password - Neo4j password

Environment Variables
Non-sensitive configuration:

NODE_ENV=production
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_GRAPHQL_URL
ENABLE_EXECUTIVE_ONBOARDING=true
ONBOARDING_SEQUENCE=alexandra,courtney,denauld

💰 Cost Optimization
Azure Free Tier Usage

Container Apps: 180,000 vCore-seconds/month
Container Registry: 10GB storage (Basic)
Log Analytics: 5GB ingestion/month
Bandwidth: 100GB outbound/month

Current Configuration

CPU: 0.5 cores
Memory: 1.0 GB
Scaling: 0-10 replicas (scales to zero when idle)
Estimated Cost: ~$10-20/month (beyond free tier)

🔧 Common Commands
View Application
bash# Get URL
az containerapp show \
  --name amt-dashboard \
  --resource-group amt-production \
  --query "properties.configuration.ingress.fqdn" \
  -o tsv

# Open in browser
open https://$(az containerapp show \
  --name amt-dashboard \
  --resource-group amt-production \
  --query "properties.configuration.ingress.fqdn" \
  -o tsv)
View Logs
bash# Tail logs
az containerapp logs show \
  --name amt-dashboard \
  --resource-group amt-production \
  --follow

# Last 100 lines
az containerapp logs show \
  --name amt-dashboard \
  --resource-group amt-production \
  --tail 100
Update Configuration
bash# Update environment variable
az containerapp update \
  --name amt-dashboard \
  --resource-group amt-production \
  --set-env-vars "FEATURE_NEW_MODULE=true"

# Scale up
az containerapp update \
  --name amt-dashboard \
  --resource-group amt-production \
  --min-replicas 1 \
  --max-replicas 20
Restart Application
bashaz containerapp revision restart \
  --name amt-dashboard \
  --resource-group amt-production
🧪 Testing
Manual Testing

Registration Flow

Visit: https://[your-url]/auth/register
Fill registration form
Verify: Alexandra → Courtney → Denauld sequence
Confirm: Landing on dashboard


Module Access

Test: Power Playbooks module (active)
Test: M.E.L. AI interface (active)
Verify: Other modules show "Coming Soon"


GraphQL Integration

Navigate to any data-driven page
Verify: Data loads from GraphQL Federation
Check: Browser console for GraphQL queries


Triangle Defense

Access formation pages
Verify: Neo4j graph queries execute
Check: Formation classifications display



Automated Testing
bash# Run verification script
./verify-deployment.sh

# Should check:
# - Container App status
# - Network connectivity
# - Configuration
# - Resource usage
# - Recent logs
# - Integration endpoints
📝 Deployment Checklist
Pre-Deployment

 Azure CLI installed (az --version)
 Docker installed (docker --version)
 Git installed (git --version)
 Azure account authenticated (az account show)
 Environment variables configured (.env.azure)
 Repository access verified

Deployment

 Run ./deploy-amt-dashboard.sh
 Verify build successful
 Verify push to registry successful
 Verify Container App created/updated
 Note application URL

Post-Deployment

 Run ./configure-secrets.sh
 Run ./verify-deployment.sh
 Test HTTPS endpoint
 Test registration flow
 Test executive bot sequence
 Verify GraphQL connectivity
 Verify Supabase real-time
 Verify Neo4j queries
 Configure custom domain (optional)
 Set up GitHub Actions (optional)

🆘 Troubleshooting
Deployment Fails
bash# Check Azure resources
az group show --name amt-production
az containerapp list --resource-group amt-production -o table

# Check registry
az acr show --name dbcamtregistry
az acr repository list --name dbcamtregistry
Application Not Starting
bash# Check status
az containerapp show \
  --name amt-dashboard \
  --resource-group amt-production \
  --query "properties.runningStatus"

# Check logs for errors
az containerapp logs show \
  --name amt-dashboard \
  --resource-group amt-production \
  --tail 50
Secrets Not Working
bash# List secrets (names only)
az containerapp secret list \
  --name amt-dashboard \
  --resource-group amt-production

# Re-run configuration
./configure-secrets.sh
📚 Additional Resources

Full Documentation: DEPLOYMENT_README.md
Azure Container Apps: https://learn.microsoft.com/en-us/azure/container-apps/
AMT Platform: https://analyzemyteam.com
Support: support@analyzemyteam.com

🎯 Success Criteria
Deployment is successful when:

✅ Container App status: Running
✅ HTTPS endpoint returns HTTP 200
✅ Registration page accessible
✅ Executive bot sequence works
✅ Dashboard loads with all modules
✅ GraphQL queries execute
✅ No errors in logs

🏆 What's Next
After successful deployment:

Configure Custom Domain

Set up portal.analyzemyteam.com
Configure SSL certificate


Enable CI/CD

Set up GitHub Actions
Automatic deployments on push to main


Add Monitoring

Configure alerts
Set up dashboards
Enable Application Insights


User Management

Set up admin accounts
Configure RBAC roles
Test user permissions


Integration Testing

Test all 12 modules
Verify Triangle Defense queries
Validate M.E.L. AI responses




Repository: https://github.com/AnalyzeMyTeamHQ/analyzemyteam-dashboard
Deployment Package Version: 1.0.0
Last Updated: October 2025
Created By: Alexandra "The Coordinator" Martinez
