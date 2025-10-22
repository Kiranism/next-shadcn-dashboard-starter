#!/bin/bash

###############################################################################
# AMT Dashboard - Azure Secrets Configuration Script
# Configures secrets and sensitive environment variables
###############################################################################

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔐 AMT Dashboard Secrets Configuration${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Azure Configuration
RESOURCE_GROUP="amt-production"
CONTAINER_APP_NAME="amt-dashboard"

print_step() {
    echo -e "\n${GREEN}▶ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ ERROR: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING: $1${NC}"
}

# Check if .env.azure file exists
if [ ! -f ".env.azure" ]; then
    print_error ".env.azure file not found!"
    echo ""
    echo "Please create .env.azure file with your secrets:"
    echo "  cp .env.azure.template .env.azure"
    echo "  # Edit .env.azure with your actual values"
    echo ""
    exit 1
fi

# Load environment variables
print_step "Loading environment variables from .env.azure..."
export $(cat .env.azure | grep -v '^#' | xargs)
print_success "Environment variables loaded"

# Validate required secrets
print_step "Validating required secrets..."

REQUIRED_SECRETS=(
    "JWT_SECRET"
    "ANTHROPIC_API_KEY"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "NEO4J_URI"
    "NEO4J_PASSWORD"
)

MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if [ -z "${!secret}" ]; then
        MISSING_SECRETS+=("$secret")
    fi
done

if [ ${#MISSING_SECRETS[@]} -ne 0 ]; then
    print_error "Missing required secrets:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "  - $secret"
    done
    echo ""
    echo "Please set these values in .env.azure"
    exit 1
fi

print_success "All required secrets present"

# Set secrets in Azure Container App
print_step "Setting secrets in Azure Container App..."

az containerapp secret set \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --secrets \
        jwt-secret="${JWT_SECRET}" \
        anthropic-key="${ANTHROPIC_API_KEY}" \
        supabase-url="${NEXT_PUBLIC_SUPABASE_URL}" \
        supabase-anon-key="${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
        supabase-service-role-key="${SUPABASE_SERVICE_ROLE_KEY}" \
        neo4j-uri="${NEO4J_URI}" \
        neo4j-password="${NEO4J_PASSWORD}" \
        mel-api-key="${MEL_API_KEY}" \
        hubspot-token="${HUBSPOT_ACCESS_TOKEN}" \
        sentry-dsn="${NEXT_PUBLIC_SENTRY_DSN}"

if [ $? -eq 0 ]; then
    print_success "Secrets configured successfully"
else
    print_error "Failed to configure secrets"
    exit 1
fi

# Update environment variables to reference secrets
print_step "Updating environment variables to reference secrets..."

az containerapp update \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --set-env-vars \
        "JWT_SECRET=secretref:jwt-secret" \
        "ANTHROPIC_API_KEY=secretref:anthropic-key" \
        "NEXT_PUBLIC_SUPABASE_URL=secretref:supabase-url" \
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=secretref:supabase-anon-key" \
        "SUPABASE_SERVICE_ROLE_KEY=secretref:supabase-service-role-key" \
        "NEO4J_URI=secretref:neo4j-uri" \
        "NEO4J_PASSWORD=secretref:neo4j-password" \
        "MEL_API_KEY=secretref:mel-api-key" \
        "HUBSPOT_ACCESS_TOKEN=secretref:hubspot-token" \
        "NEXT_PUBLIC_SENTRY_DSN=secretref:sentry-dsn"

if [ $? -eq 0 ]; then
    print_success "Environment variables updated"
else
    print_error "Failed to update environment variables"
    exit 1
fi

# List configured secrets (without values)
print_step "Configured secrets:"

az containerapp secret list \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --query "[].name" \
    -o table

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Secrets configuration complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
