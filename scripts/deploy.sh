#!/bin/bash

# SaaS Bonus System - Deployment Script
# Usage: ./deploy.sh [local|vps|docker]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Check prerequisites
check_requirements() {
    print_info "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js >= 18.0.0"
    fi
    
    # Check yarn
    if ! command -v yarn &> /dev/null; then
        print_warning "yarn is not installed. Enabling via corepack..."
        corepack enable && corepack prepare yarn@stable --activate
    fi
    yarn install
    yarn dlx prisma generate
    yarn prisma:migrate
        yarn prisma:seed
    yarn dev
    docker-compose exec app yarn prisma:migrate
    # Install yarn
    corepack enable && corepack prepare yarn@stable --activate
yarn install
yarn build
}

# Setup environment
setup_env() {
    print_info "Setting up environment..."
    
    if [ ! -f .env.local ]; then
        if [ -f env.example.txt ]; then
            cp env.example.txt .env.local
            print_warning "Created .env.local from env.example.txt"
            print_warning "Please edit .env.local with your configuration"
            read -p "Press enter to continue after editing .env.local..."
        else
            print_error "env.example.txt not found"
        fi
    else
        print_success ".env.local already exists"
    fi
}

# Install dependencies
install_deps() {
    print_info "Installing dependencies..."
    yarn install
    print_success "Dependencies installed"
}

# Setup database
setup_database() {
    print_info "Setting up database..."
    
    # Generate Prisma Client
    yarn prisma:generate
    
    # Run migrations
    yarn prisma:migrate
    
    # Optional: Seed database
    read -p "Do you want to seed the database with test data? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        yarn prisma:seed
    fi
    
    print_success "Database setup complete"
}

# Local deployment
deploy_local() {
    print_info "Starting local deployment..."
    
    check_requirements
    setup_env
    install_deps
    setup_database
    
    print_info "Starting development server..."
    print_success "Local deployment ready!"
    print_info "Access the application at: http://localhost:5006"
    
    yarn dev
}

# Docker deployment
deploy_docker() {
    print_info "Starting Docker deployment..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
    fi
    
    setup_env
    
    print_info "Building and starting containers..."
    docker-compose up -d --build
    
    print_info "Waiting for services to be ready..."
    sleep 10
    
    print_info "Running migrations..."
    docker-compose exec app yarn prisma:migrate
    
    print_success "Docker deployment complete!"
    print_info "Access the application at: http://localhost:5006"
    print_info "View logs: docker-compose logs -f"
}

# VPS deployment
deploy_vps() {
    print_info "Starting VPS deployment..."
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then 
        print_error "Please run as root for VPS deployment"
    fi
    
    print_info "Installing system dependencies..."
    apt update && apt upgrade -y
    apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx
    
    # Install Node.js
    if ! command -v node &> /dev/null; then
        print_info "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs
    fi
    
    # Install yarn
    corepack enable && corepack prepare yarn@stable --activate && npm install -g pm2
    
    # Install PostgreSQL
    print_info "Installing PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    
    # Install Redis
    print_info "Installing Redis..."
    apt install -y redis-server
    systemctl enable redis-server
    systemctl start redis-server
    
    # Setup application
    print_info "Setting up application..."
    
    # Create user
    if ! id -u nodeapp > /dev/null 2>&1; then
        useradd -m -s /bin/bash nodeapp
    fi
    
    # Clone or update repository
    if [ ! -d /home/nodeapp/saas-bonus-system ]; then
        su - nodeapp -c "git clone https://github.com/your-username/saas-bonus-system.git"
    else
        su - nodeapp -c "cd saas-bonus-system && git pull"
    fi
    
    # Setup as nodeapp user
    su - nodeapp << 'EOF'
cd saas-bonus-system
yarn install
yarn build
pm2 start ecosystem.config.js
pm2 save
EOF
    
    # Setup PM2 startup
    pm2 startup systemd -u nodeapp --hp /home/nodeapp
    
    # Setup Nginx
    print_info "Configuring Nginx..."
    
    read -p "Enter your domain name: " domain
    
    cat > /etc/nginx/sites-available/saas-bonus-system << EOF
server {
    listen 80;
    server_name $domain;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/saas-bonus-system /etc/nginx/sites-enabled/
    nginx -t && systemctl restart nginx
    
    # Setup SSL
    read -p "Do you want to setup SSL with Let's Encrypt? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        certbot --nginx -d $domain
    fi
    
    # Setup firewall
    print_info "Setting up firewall..."
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    
    print_success "VPS deployment complete!"
    print_info "Access your application at: http://$domain"
}

# Main script
main() {
    echo "======================================"
    echo "  SaaS Bonus System Deployment Tool  "
    echo "======================================"
    echo
    
    case "$1" in
        local)
            deploy_local
            ;;
        docker)
            deploy_docker
            ;;
        vps)
            deploy_vps
            ;;
        *)
            echo "Usage: $0 {local|docker|vps}"
            echo
            echo "Options:"
            echo "  local  - Deploy locally for development"
            echo "  docker - Deploy using Docker Compose"
            echo "  vps    - Deploy on VPS (Ubuntu/Debian)"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"