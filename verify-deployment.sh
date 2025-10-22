#!/bin/bash

###############################################################################
# AMT Dashboard - Deployment Verification Script
# Tests deployed Container App and validates all integrations
###############################################################################

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 AMT Dashboard Deployment Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Configuration
RESOURCE_GROUP="amt-production"
CONTAINER_APP_NAME="amt-dashboard"

print_section() {
    echo ""
    echo -e "${BLUE}━━━ $1 ━━━${NC}"
}

print_step() {
    echo -e "\n${GREEN}▶ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Get application URL
print_step "Retrieving application URL..."
APP_URL=$(az containerapp show \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --query "properties.configuration.ingress.fqdn" \
    -o tsv 2>/dev/null)

if [ -z "$APP_URL" ]; then
    print_error "Failed to retrieve application URL"
    print_warning "Container App may not be deployed yet"
    exit 1
fi

print_success "Application URL: https://${APP_URL}"

###############################################################################
# Container App Status
###############################################################################
print_section "Container App Status"

print_step "Checking provisioning state..."
PROVISIONING_STATE=$(az containerapp show \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --query "properties.provisioningState" \
    -o tsv)

if [ "$PROVISIONING_STATE" == "Succeeded" ]; then
    print_success "Provisioning state: $PROVISIONING_STATE"
else
    print_warning "Provisioning state: $PROVISIONING_STATE"
fi

print_step "Checking running status..."
RUNNING_STATUS=$(az containerapp show \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --query "properties.runningStatus" \
    -o tsv)

if [ "$RUNNING_STATUS" == "Running" ]; then
    print_success "Running status: $RUNNING_STATUS"
else
    print_warning "Running status: $RUNNING_STATUS"
fi

print_step "Checking replica count..."
REPLICAS=$(az containerapp replica list \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --query "length([])" \
    -o tsv 2>/dev/null || echo "0")

print_success "Active replicas: $REPLICAS"

###############################################################################
# Network Connectivity
###############################################################################
print_section "Network Connectivity"

print_step "Testing HTTPS endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${APP_URL}" --max-time 30)

if [ "$HTTP_STATUS" == "200" ] || [ "$HTTP_STATUS" == "301" ] || [ "$HTTP_STATUS" == "302" ]; then
    print_success "HTTPS endpoint responding (HTTP $HTTP_STATUS)"
else
    print_warning "HTTPS endpoint returned HTTP $HTTP_STATUS"
fi

print_step "Testing health endpoint..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${APP_URL}/api/health" --max-time 10 2>/dev/null || echo "000")

if [ "$HEALTH_STATUS" == "200" ]; then
    print_success "Health endpoint OK"
elif [ "$HEALTH_STATUS" == "404" ]; then
    print_warning "Health endpoint not implemented (optional)"
else
    print_warning "Health endpoint returned HTTP $HEALTH_STATUS"
fi

###############################################################################
# Configuration
###############################################################################
print_section "Configuration"

print_step "Checking environment variables..."
ENV_COUNT=$(az containerapp show \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --query "length(properties.template.containers[0].env)" \
    -o tsv)

print_success "Environment variables configured: $ENV_COUNT"

print_step "Checking secrets..."
SECRET_COUNT=$(az containerapp secret list \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --query "length([])" \
    -o tsv 2>/dev/null || echo "0")

print_success "Secrets configured: $SECRET_COUNT"

print_step "Checking scaling configuration..."
MIN_REPLICAS=$(az containerapp show \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --query "properties.template.scale.minReplicas" \
    -o tsv)

MAX_REPLICAS=$(az containerapp show \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --query "properties.template.scale.maxReplicas" \
    -o tsv)

print_success "Scaling: Min=$MIN_REPLICAS, Max=$MAX_REPLICAS"

###############################################################################
# Resource Usage
###############################################################################
print_section "Resource Usage"

print_step "Checking CPU allocation..."
CPU=$(az containerapp show \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --query "properties.template.containers[0].resources.cpu" \
    -o tsv)

print_success "CPU: $CPU cores"

print_step "Checking memory allocation..."
MEMORY=$(az containerapp show \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --query "properties.template.containers[0].resources.memory" \
    -o tsv)

print_success "Memory: $MEMORY"

###############################################################################
# Container Image
###############################################################################
print_section "Container Image"

print_step "Checking container image..."
IMAGE=$(az containerapp show \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --query "properties.template.containers[0].image" \
    -o tsv)

print_success "Image: $IMAGE"

###############################################################################
# Recent Logs
###############################################################################
print_section "Recent Logs"

print_step "Fetching last 10 log entries..."
echo ""
az containerapp logs show \
    --name ${CONTAINER_APP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --tail 10 \
    2>/dev/null || print_warning "Could not fetch logs (may not be available yet)"

###############################################################################
# Integration Tests
###############################################################################
print_section "Integration Tests"

print_step "Testing registration page..."
REG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${APP_URL}/auth/register" --max-time 10)

if [ "$REG_STATUS" == "200" ]; then
    print_success "Registration page accessible"
else
    print_warning "Registration page returned HTTP $REG_STATUS"
fi

print_step "Testing login page..."
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${APP_URL}/auth/login" --max-time 10)

if [ "$LOGIN_STATUS" == "200" ]; then
    print_success "Login page accessible"
else
    print_warning "Login page returned HTTP $LOGIN_STATUS"
fi

###############################################################################
# Summary
###############################################################################
print_section "Deployment Summary"

echo ""
echo -e "${GREEN}Application Information:${NC}"
echo "  URL: https://${APP_URL}"
echo "  Status: $RUNNING_STATUS"
echo "  Replicas: $REPLICAS"
echo "  CPU: $CPU cores"
echo "  Memory: $MEMORY"
echo ""

echo -e "${YELLOW}Quick Commands:${NC}"
echo ""
echo "View Logs:"
echo "  az containerapp logs show --name ${CONTAINER_APP_NAME} --resource-group ${RESOURCE_GROUP} --follow"
echo ""
echo "Restart Container App:"
echo "  az containerapp revision restart --name ${CONTAINER_APP_NAME} --resource-group ${RESOURCE_GROUP}"
echo ""
echo "Scale Container App:"
echo "  az containerapp update --name ${CONTAINER_APP_NAME} --resource-group ${RESOURCE_GROUP} --min-replicas 1 --max-replicas 5"
echo ""
echo "Open in Browser:"
echo "  open https://${APP_URL}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Verification Complete${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
