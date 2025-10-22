AMT Dashboard Azure Deployment - Complete Package
Welcome to the complete Azure deployment package for the AnalyzeMyTeam Dashboard!
📦 Package Contents
FileDescriptionPurposeQUICK_START.md5-minute quick start guideGet started immediatelyDEPLOYMENT_README.mdComprehensive deployment guideDetailed instructionsARCHITECTURE.mdSystem architecture diagramsUnderstand the systemdeploy-amt-dashboard.shMain deployment scriptAutomated deploymentconfigure-secrets.shSecrets configurationSecure configurationverify-deployment.shVerification scriptPost-deployment testing.env.azure.templateEnvironment variables templateConfiguration template
🚀 Getting Started
Option 1: Quick Deploy (Recommended)
bash# 1. Configure environment
cp .env.azure.template .env.azure
nano .env.azure

# 2. Login to Azure
az login

# 3. Deploy
chmod +x *.sh
./deploy-amt-dashboard.sh

# 4. Configure secrets
./configure-secrets.sh

# 5. Verify
./verify-deployment.sh
Option 2: Read Documentation First

Read QUICK_START.md for overview
Read DEPLOYMENT_README.md for details
Review ARCHITECTURE.md for system understanding
Follow deployment steps

🎯 What Gets Deployed
Infrastructure

Container App: amt-dashboard (Next.js 15)
Container Image: dbcamtregistry.azurecr.io/amt-dashboard:latest
Environment: amt-production (existing resource group)
Scaling: 0-10 replicas (auto-scale, cost-optimized)

Features

✅ Executive bot onboarding (Alexandra → Courtney → Denauld)
✅ 12-module dashboard (2 active, 10 coming soon)
✅ Triangle Defense integration
✅ M.E.L. AI command interface
✅ JWT authentication + RBAC
✅ GraphQL Federation connectivity
✅ Supabase real-time subscriptions
✅ Neo4j graph queries

🔐 Required Secrets
You must configure these in .env.azure:
SecretRequiredPurposeJWT_SECRET✅JWT authenticationANTHROPIC_API_KEY✅M.E.L. AI (Claude)NEXT_PUBLIC_SUPABASE_URL✅Supabase databaseNEXT_PUBLIC_SUPABASE_ANON_KEY✅Supabase authNEO4J_URI✅Triangle Defense graphNEO4J_PASSWORD✅Neo4j authenticationHUBSPOT_ACCESS_TOKEN⚪CRM integration (optional)NEXT_PUBLIC_SENTRY_DSN⚪Error tracking (optional)
📊 Architecture Overview
GitHub → Azure Container Registry → Container App
                                           ↓
                          ┌────────────────┼────────────────┐
                          ↓                ↓                ↓
                   GraphQL Federation  Supabase         Neo4j
                   (Hive/Supabase/     Real-time      Triangle
                    Neo4j unified)     Database       Defense
Existing Resources Used:

Resource Group: amt-production ✅
Container Registry: dbcamtregistry ✅
Environment: managedEnvironment-amtproduction-b6cb ✅
Log Analytics: workspaceamtproduction9838 ✅
M.E.L. Service: mel-service ✅

💰 Cost Information
Free Tier Coverage:

Container Apps: 180,000 vCore-seconds/month FREE
Container Registry: 10GB storage FREE
Log Analytics: 5GB ingestion/month FREE
Bandwidth: 100GB outbound/month FREE

Estimated Costs:

Within free tier: $0/month
Low traffic: ~$10-20/month
High traffic: ~$50-75/month

🎭 Executive Bot Onboarding
New users experience a three-step executive introduction:

Alexandra Martinez - Chief Administrative Officer

Welcome and platform orientation
8 seconds


Courtney Sellars - CEO/Chief Legal Officer

Security and compliance overview
8 seconds


Denauld Brown - Founder & Defensive Coordinator

Triangle Defense welcome
10 seconds



Then lands on the dashboard.
🔧 Quick Commands Reference
View Application
bashaz containerapp show --name amt-dashboard --resource-group amt-production \
  --query "properties.configuration.ingress.fqdn" -o tsv
View Logs
bashaz containerapp logs show --name amt-dashboard --resource-group amt-production --follow
Update Environment Variable
bashaz containerapp update --name amt-dashboard --resource-group amt-production \
  --set-env-vars "FEATURE_NEW=true"
Restart Application
bashaz containerapp revision restart --name amt-dashboard --resource-group amt-production
✅ Deployment Checklist
Pre-Deployment

 Azure CLI installed
 Docker installed
 Azure authenticated
 Environment variables configured
 Repository access verified

Deployment

 Run deployment script
 Verify build success
 Verify push to registry
 Verify Container App created
 Note application URL

Post-Deployment

 Configure secrets
 Run verification script
 Test HTTPS endpoint
 Test registration/onboarding
 Verify integrations
 Configure monitoring

🆘 Support
Documentation Questions:

Read DEPLOYMENT_README.md for comprehensive guide
Read ARCHITECTURE.md for system details

Deployment Issues:

Check deployment script output
Run verification script
Check Azure portal logs

Technical Support:

Email: support@analyzemyteam.com
Slack: #amt-portal-support
Documentation: https://docs.analyzemyteam.com

📚 Documentation Map
INDEX.md (You are here)
├── QUICK_START.md .............. 5-minute quick start
├── DEPLOYMENT_README.md ........ Full deployment guide  
├── ARCHITECTURE.md ............. System architecture
├── .env.azure.template ......... Configuration template
├── deploy-amt-dashboard.sh ..... Main deployment script
├── configure-secrets.sh ........ Secrets configuration
└── verify-deployment.sh ........ Verification testing
🎯 Success Criteria
Deployment successful when:

✅ Container App status: Running
✅ HTTPS endpoint returns HTTP 200
✅ Registration page loads
✅ Executive bot sequence works
✅ Dashboard displays all modules
✅ GraphQL queries execute
✅ No errors in logs

🚀 Next Steps After Deployment

Configure Custom Domain (optional)

Set up DNS: portal.analyzemyteam.com
Configure SSL certificate


Enable CI/CD (recommended)

Set up GitHub Actions
Automatic deployments


Configure Monitoring (recommended)

Set up alerts
Create dashboards


User Management

Create admin accounts
Configure RBAC


Integration Testing

Test all modules
Validate Triangle Defense
Test M.E.L. AI




Package Version: 1.0.0
Repository: AnalyzeMyTeamHQ/analyzemyteam-dashboard
Last Updated: October 2025
Created By: Claude (with guidance from Denauld Brown and the AMT executive team)
Ready to deploy? Start with QUICK_START.md!
