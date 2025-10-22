#!/bin/bash

#############################################################################
# AMT Dashboard - Azure Container App Deployment Script
# Deploys analyzemyteam-dashboard to Azure Container Apps
# 
# Prerequisites:
# - Azure CLI installed and authenticated (az login)
# - Docker installed and running
# - Access to dbcamtregistry container registry
# - Environment variables configured
#############################################################################

set -e  # Exit on error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 AMT Dashboard Deployment Script${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

#############################################################################
# CONFIGURATION
#############################################################################

# Azure Resources
RESOURCE_GROUP="amt-production"
CONTAINER_APP_NAME="amt-dashboard"
CONTAINER_REGISTRY="dbcamtregistry"
MANAGED_ENVIRONMENT="managedEnvironment-amtproduction-b6cb"
LOG_ANALYTICS_WORKSPACE="workspaceamtproduction9838"

# Docker Image
IMAGE_NAME="${CONTAINER_REGISTRY}.azurecr.io/amt-dashboard"
IMAGE_TAG="latest"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

# Container Configuration
TARGET_PORT=3000
MIN_REPLICAS=0
MAX_REPLICAS=10
CPU="0.5"
MEMORY="1.0Gi"

# GitHub Repository
GITHUB_REPO="AnalyzeMyTeamHQ/analyzemyteam-dashboard"
GITHUB_URL="https://github.com/${GITHUB_REPO}.git"
REPO_BRANCH="main"

#############################################################################
# FUNCTIONS
#############################################################################

print_step() {
    echo -e "\n${GREEN}▶ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ ERROR: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI not found. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    print_success "Azure CLI installed"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install Docker"
        exit 1
    fi
    print_success "Docker installed"
    
    # Check Azure login
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure. Please run: az login"
        exit 1
    fi
    print_success "Azure CLI authenticated"
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git not found. Please install Git"
        exit 1
    fi
    print_success "Git installed"
}

clone_repository() {
    print_step "Cloning repository..."
    
    if [ -d "analyzemyteam-dashboard" ]; then
        print_warning "Repository directory exists. Updating..."
        cd analyzemyteam-dashboard
        git fetch origin
        git reset --hard origin/${REPO_BRANCH}
        cd ..
    else
        git clone -b ${REPO_BRANCH} ${GITHUB_URL}
    fi
    
    print_success "Repository ready"
}

login_container_registry() {
    print_step "Logging in to Azure Container Registry..."
    
    az acr login --name ${CONTAINER_REGISTRY}
    
    if [ $? -eq 0 ]; then
        print_success "Logged in to ${CONTAINER_REGISTRY}"
    else
        print_error "Failed to login to container registry"
        exit 1
    fi
}

build_docker_image() {
    print_step "Building Docker image..."
    
    cd analyzemyteam-dashboard
    
    # Build for linux/amd64 platform (Azure requirement)
    docker build \
        --platform linux/amd64 \
        -t ${FULL_IMAGE} \
        -f Dockerfile \
        --build-arg NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-"https://api.analyzemyteam.com"} \
        --build-arg NEXT_PUBLIC_GRAPHQL_URL=${NEXT_PUBLIC_GRAPHQL_URL:-"https://graphql.analyzemyteam.com/graphql"} \
        .
    
    if [ $? -eq 0 ]; then
        print_success "Docker image built successfully"
    else
        print_error "Failed to build Docker image"
        exit 1
    fi
    
    cd ..
}

push_docker_image() {
    print_step "Pushing Docker image to registry..."
    
    docker push ${FULL_IMAGE}
    
    if [ $? -eq 0 ]; then
        print_success "Image pushed to ${FULL_IMAGE}"
    else
        print_error "Failed to push Docker image"
        exit 1
    fi
}

check_container_app_exists() {
    az containerapp show \
        --name ${CONTAINER_APP_NAME} \
        --resource-group ${RESOURCE_GROUP} \
        &> /dev/null
    
    return $?
}

create_container_app() {
    print_step "Creating Container App..."
    
    az containerapp create \
        --name ${CONTAINER_APP_NAME} \
        --resource-group ${RESOURCE_GROUP} \
        --environment ${MANAGED_ENVIRONMENT} \
        --image ${FULL_IMAGE} \
        --registry-server ${CONTAINER_REGISTRY}.azurecr.io \
        --target-port ${TARGET_PORT} \
        --ingress external \
        --cpu ${CPU} \
        --memory ${MEMORY} \
        --min-replicas ${MIN_REPLICAS} \
        --max-replicas ${MAX_REPLICAS} \
        --env-vars \
            "NODE_ENV=production" \
            "NEXT_PUBLIC_API_URL=https://api.analyzemyteam.com" \
            "NEXT_PUBLIC_GRAPHQL_URL=https://graphql.analyzemyteam.com/graphql" \
            "ENABLE_EXECUTIVE_ONBOARDING=true" \
            "ONBOARDING_SEQUENCE=alexandra,courtney,denauld"
    
    if [ $? -eq 0 ]; then
        print_success "Container App created successfully"
    else
        print_error "Failed to create Container App"
        exit 1
    fi
}

update_container_app() {
    print_step "Updating Container App..."
    
    az containerapp update \
        --name ${CONTAINER_APP_NAME} \
        --resource-group ${RESOURCE_GROUP} \
        --image ${FULL_IMAGE}
    
    if [ $? -eq 0 ]; then
        print_success "Container App updated successfully"
    else
        print_error "Failed to update Container App"
        exit 1
    fi
}

configure_scaling() {
    print_step "Configuring auto-scaling rules..."
    
    az containerapp update \
        --name ${CONTAINER_APP_NAME} \
        --resource-group ${RESOURCE_GROUP} \
        --scale-rule-name http-scale-rule \
        --scale-rule-type http \
        --scale-rule-http-concurrency 50
    
    if [ $? -eq 0 ]; then
        print_success "Auto-scaling configured"
    else
        print_warning "Failed to configure auto-scaling (non-critical)"
    fi
}

get_app_url() {
    print_step "Retrieving application URL..."
    
    APP_URL=$(az containerapp show \
        --name ${CONTAINER_APP_NAME} \
        --resource-group ${RESOURCE_GROUP} \
        --query properties.configuration.ingress.fqdn \
        -o tsv)
    
    if [ -n "$APP_URL" ]; then
        print_success "Application URL: https://${APP_URL}"
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}🎉 Deployment Complete!${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "🌐 Dashboard URL: ${GREEN}https://${APP_URL}${NC}"
        echo ""
    else
        print_error "Failed to retrieve application URL"
    fi
}

show_next_steps() {
    echo -e "${YELLOW}📝 Next Steps:${NC}"
    echo ""
    echo "1. Configure secrets (if not already done):"
    echo "   az containerapp secret set --name ${CONTAINER_APP_NAME} --resource-group ${RESOURCE_GROUP} \\"
    echo "     --secrets jwt-secret=<YOUR_JWT_SECRET> anthropic-key=<YOUR_KEY>"
    echo ""
    echo "2. Update environment variables to use secrets:"
    echo "   az containerapp update --name ${CONTAINER_APP_NAME} --resource-group ${RESOURCE_GROUP} \\"
    echo "     --set-env-vars JWT_SECRET=secretref:jwt-secret ANTHROPIC_API_KEY=secretref:anthropic-key"
    echo ""
    echo "3. Test executive bot onboarding:"
    echo "   - Visit https://${APP_URL}/auth/register"
    echo "   - Complete registration"
    echo "   - Experience Alexandra → Courtney → Denauld sequence"
    echo ""
    echo "4. View logs:"
    echo "   az containerapp logs show --name ${CONTAINER_APP_NAME} --resource-group ${RESOURCE_GROUP} --follow"
    echo ""
    echo "5. Monitor in Azure Portal:"
    echo "   https://portal.azure.com/#resource/subscriptions/<SUB_ID>/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.App/containerApps/${CONTAINER_APP_NAME}"
    echo ""
}

#############################################################################
# MAIN EXECUTION
#############################################################################

main() {
    echo ""
    echo "Target Resource Group: ${RESOURCE_GROUP}"
    echo "Container App Name: ${CONTAINER_APP_NAME}"
    echo "Container Registry: ${CONTAINER_REGISTRY}"
    echo "GitHub Repository: ${GITHUB_REPO}"
    echo ""
    
    # Execute deployment steps
    check_prerequisites
    clone_repository
    login_container_registry
    build_docker_image
    push_docker_image
    
    # Check if Container App exists
    if check_container_app_exists; then
        print_warning "Container App already exists. Updating..."
        update_container_app
    else
        create_container_app
    fi
    
    configure_scaling
    get_app_url
    show_next_steps
}

# Run main function
main
