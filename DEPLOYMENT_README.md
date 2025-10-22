AMT Dashboard - Azure Container Apps Deployment
Complete deployment guide for analyzemyteam-dashboard to Azure Container Apps with executive bot onboarding.
🎯 Overview
This deployment sets up the AMT Portal with:

Next.js 15 dashboard on Azure Container Apps
Executive bot onboarding (Alexandra → Courtney → Denauld)
GraphQL Federation integration
Supabase real-time database
Neo4j Triangle Defense graph queries
M.E.L. AI integration

🏗️ Architecture
┌─────────────────────────────────────────────────────────────┐
│                    Azure Container Apps                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  amt-dashboard (Next.js 15)                            │ │
│  │  - Executive Bot Onboarding                            │ │
│  │  - 12 Module Dashboard                                 │ │
│  │  - Triangle Defense Integration                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├──── GraphQL Federation
                            │     (Hive, Supabase, Neo4j)
                            │
                            ├──── M.E.L. Service (mel-service)
                            │
                            └──── Supabase Real-time

Existing Resources:
├── Resource Group: amt-production ✅
├── Container Registry: dbcamtregistry ✅
├── Environment: managedEnvironment-amtproduction-b6cb ✅
├── Log Analytics: workspaceamtproduction9838 ✅
└── M.E.L. Service: mel-service ✅
📋 Prerequisites
Required Tools

✅ Azure CLI (az)
✅ Docker
✅ Git
✅ Node.js 18+ (for local testing)

Required Credentials

Azure subscription access
GitHub access to AnalyzeMyTeamHQ/analyzemyteam-dashboard
Container registry credentials
API keys and secrets (see .env.azure.template)

Verify Azure Resources
bash# Check existing resources
az group show --name amt-production
az containerapp list --resource-group amt-production -o table
az acr show --name dbcamtregistry
🚀 Deployment Steps
Step 1: Clone Deployment Scripts
bash# Download deployment scripts
git clone https://github.com/AnalyzeMyTeamHQ/analyzemyteam-dashboard.git
cd analyzemyteam-dashboard

# Or use the standalone deployment scripts
# (Scripts are provided in this directory)
Step 2: Configure Environment Variables
bash# Copy template
cp .env.azure.template .env.azure

# Edit with your actual values
nano .env.azure

# Required values:
# - JWT_SECRET
# - ANTHROPIC_API_KEY
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - NEO4J_URI
# - NEO4J_PASSWORD
Step 3: Login to Azure
bash# Login to Azure
az login

# Set subscription (if you have multiple)
az account set --subscription "Azure subscription 1"

# Verify
az account show
Step 4: Run Deployment Script
bash# Make scripts executable
chmod +x deploy-amt-dashboard.sh
chmod +x configure-secrets.sh

# Run deployment
./deploy-amt-dashboard.sh
The script will:

✅ Check prerequisites
✅ Clone/update repository
✅ Login to container registry
✅ Build Docker image
✅ Push to registry
✅ Create/update Container App
✅ Configure auto-scaling
✅ Display application URL

Step 5: Configure Secrets
bash# Configure secrets in Azure
./configure-secrets.sh
This will:

Validate required secrets
Store secrets in Azure Container App
Update environment variables to reference secrets

Step 6: Verify Deployment
bash# Check Container App status
az containerapp show \
  --name amt-dashboard \
  --resource-group amt-production \
  --query "properties.runningStatus"

# View logs
az containerapp logs show \
  --name amt-dashboard \
  --resource-group amt-production \
  --follow

# Get application URL
az containerapp show \
  --name amt-dashboard \
  --resource-group amt-production \
  --query "properties.configuration.ingress.fqdn" \
  -o tsv
🎭 Executive Bot Onboarding
Onboarding Sequence
When users register, they experience a three-step executive introduction:

Alexandra "The Coordinator" Martinez

Chief Administrative Officer
Priority: #3
Role: Operations coordination and mission control


Courtney "The Shield" Sellars

CEO/Chief Legal Officer
Priority: #2
Role: Legal protection and executive authority


Denauld "The Mastermind" Brown

Founder, CEO & Defensive Coordinator
Priority: #1
Role: Supreme authority and Triangle Defense creator



Testing Onboarding Flow
bash# Get dashboard URL
DASHBOARD_URL=$(az containerapp show \
  --name amt-dashboard \
  --resource-group amt-production \
  --query "properties.configuration.ingress.fqdn" \
  -o tsv)

echo "Visit: https://${DASHBOARD_URL}/auth/register"
Expected flow:

User fills registration form
Alexandra introduces AMT platform (8 seconds)
Courtney explains legal/security (8 seconds)
Denauld welcomes to Triangle Defense (10 seconds)
User lands on dashboard

🔧 Configuration
Scaling Configuration
Current settings optimize for Azure free tier:
yamlMin Replicas: 0 (scale to zero when idle)
Max Replicas: 10 (auto-scale under load)
CPU: 0.5 cores
Memory: 1.0 GB
HTTP Concurrency: 50 requests per replica
To adjust:
bashaz containerapp update \
  --name amt-dashboard \
  --resource-group amt-production \
  --min-replicas 1 \
  --max-replicas 20 \
  --cpu 1.0 \
  --memory 2.0Gi
Custom Domain (Optional)
bash# Add custom domain
az containerapp hostname add \
  --name amt-dashboard \
  --resource-group amt-production \
  --hostname portal.analyzemyteam.com

# Bind SSL certificate
az containerapp hostname bind \
  --name amt-dashboard \
  --resource-group amt-production \
  --hostname portal.analyzemyteam.com \
  --certificate amt-ssl-cert
Environment Variable Updates
bash# Update a single environment variable
az containerapp update \
  --name amt-dashboard \
  --resource-group amt-production \
  --set-env-vars "FEATURE_DYNAMIC_FABRICATOR=true"

# View current environment variables
az containerapp show \
  --name amt-dashboard \
  --resource-group amt-production \
  --query "properties.template.containers[0].env" \
  -o table
📊 Monitoring
View Logs
bash# Tail logs in real-time
az containerapp logs show \
  --name amt-dashboard \
  --resource-group amt-production \
  --follow

# View recent logs
az containerapp logs show \
  --name amt-dashboard \
  --resource-group amt-production \
  --tail 100
Application Insights
Access metrics at:
https://portal.azure.com/#resource/subscriptions/{subscription-id}/resourceGroups/amt-production/providers/Microsoft.Insights/components/workspaceamtproduction9838
Key metrics to monitor:

Request count
Response time
Failed requests
CPU/Memory usage
Scale operations

Health Check
bash# Get dashboard URL
APP_URL=$(az containerapp show \
  --name amt-dashboard \
  --resource-group amt-production \
  --query "properties.configuration.ingress.fqdn" \
  -o tsv)

# Test endpoint
curl -I "https://${APP_URL}"
curl -I "https://${APP_URL}/api/health"
🔄 CI/CD Integration
GitHub Actions Workflow
The repository includes .github/workflows/deploy-azure.yml for automatic deployments:
yamlname: Deploy to Azure Container Apps

on:
  push:
    branches: [main]

env:
  REGISTRY: dbcamtregistry
  APP_NAME: amt-dashboard
  RESOURCE_GROUP: amt-production
Secrets Required in GitHub
Add these secrets to your GitHub repository:

AZURE_CREDENTIALS - Service principal JSON
AZURE_CONTAINER_REGISTRY_USERNAME
AZURE_CONTAINER_REGISTRY_PASSWORD

🛠️ Troubleshooting
Container App Won't Start
bash# Check container app status
az containerapp show \
  --name amt-dashboard \
  --resource-group amt-production \
  --query "properties.provisioningState"

# Check recent errors
az containerapp logs show \
  --name amt-dashboard \
  --resource-group amt-production \
  --tail 50
Image Pull Failures
bash# Verify registry credentials
az acr login --name dbcamtregistry

# List images
az acr repository list --name dbcamtregistry

# Check specific image tags
az acr repository show-tags \
  --name dbcamtregistry \
  --repository amt-dashboard
Environment Variable Issues
bash# List all environment variables
az containerapp show \
  --name amt-dashboard \
  --resource-group amt-production \
  --query "properties.template.containers[0].env"

# List secrets (names only, not values)
az containerapp secret list \
  --name amt-dashboard \
  --resource-group amt-production
Connection Issues
bash# Test GraphQL endpoint
curl -X POST "https://graphql.analyzemyteam.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'

# Test Supabase connection
curl "https://your-project.supabase.co/rest/v1/" \
  -H "apikey: your-anon-key"
💰 Cost Optimization
Azure Free Tier Limits

Container Apps: 180,000 vCore-seconds free/month
Container Registry: 10GB storage (Basic tier)
Log Analytics: 5GB ingestion free/month
Bandwidth: 100GB outbound free/month

Cost-Saving Tips

Scale to Zero: Set --min-replicas 0 for dev/staging
Use Spot Instances: For non-production workloads
Optimize Image Size: Multi-stage Docker builds
Log Retention: Configure appropriate retention periods

Monitor Costs
bash# View resource group costs
az consumption usage list \
  --resource-group amt-production \
  --query "[?resourceGroup=='amt-production']" \
  -o table
📚 Additional Resources

Azure Container Apps Documentation
Next.js Deployment Guide
AMT Platform Documentation
Triangle Defense Methodology

🆘 Support
For deployment issues:

Email: support@analyzemyteam.com
Slack: #amt-portal-support
Documentation: https://docs.analyzemyteam.com

📝 Deployment Checklist

 Azure CLI installed and authenticated
 Docker installed and running
 Repository cloned
 .env.azure configured with secrets
 Container registry accessible
 Deployment script executed successfully
 Secrets configured in Azure
 Application URL accessible
 Executive bot onboarding tested
 GraphQL Federation connectivity verified
 Supabase real-time working
 Neo4j Triangle Defense queries tested
 Monitoring configured
 Custom domain configured (if applicable)
 GitHub Actions CI/CD enabled


Repository: AnalyzeMyTeamHQ/analyzemyteam-dashboard
Deployment Date: {{ DATE }}
Deployed By: {{ YOUR_NAME }}
