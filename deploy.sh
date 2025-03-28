#!/bin/bash

# TON Education Deployment Script
# This script automates deployment of the TON Education platform

# Color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo -e "\n${GREEN}== $1 ==${NC}"
}

# Function to confirm before proceeding
confirm() {
    read -p "$(echo -e "${YELLOW}$1 (y/n): ${NC}")" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

print_header "TON Education Deployment"
echo "This script will help you deploy the TON Education platform."

# Check for docker and docker-compose
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if .env file exists, if not create it from .env.example
if [ ! -f .env ]; then
    echo -e "${YELLOW}No .env file found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}Created .env file. Please edit it with your configuration.${NC}"
        echo -e "${YELLOW}Press Enter to open the file for editing, or Ctrl+C to exit and edit it manually later.${NC}"
        read
        ${EDITOR:-nano} .env
    else
        echo -e "${RED}.env.example file not found. Please create a .env file manually.${NC}"
        exit 1
    fi
fi

# Ask for deployment type
print_header "Deployment Type"
echo "1) Development (docker-compose.yml)"
echo "2) Production (docker-compose.prod.yml)"
read -p "$(echo -e "${YELLOW}Select deployment type [1-2]: ${NC}")" deployment_type

if [ "$deployment_type" = "1" ]; then
    COMPOSE_FILE="docker-compose.yml"
    echo -e "${GREEN}Selected: Development deployment${NC}"
else
    COMPOSE_FILE="docker-compose.prod.yml"
    echo -e "${GREEN}Selected: Production deployment${NC}"
fi

# Check if we need to rebuild the containers
print_header "Build Options"
if confirm "Do you want to rebuild the containers?"; then
    BUILD_FLAG="--build"
    echo -e "${GREEN}Will rebuild containers${NC}"
else
    BUILD_FLAG=""
    echo -e "${GREEN}Will use existing containers if available${NC}"
fi

# Stop existing containers if they exist
print_header "Stopping Existing Containers"
docker-compose -f $COMPOSE_FILE down
echo -e "${GREEN}Stopped existing containers${NC}"

# Deploy the application
print_header "Starting Deployment"
echo -e "${GREEN}Running: docker-compose -f $COMPOSE_FILE up -d $BUILD_FLAG${NC}"
docker-compose -f $COMPOSE_FILE up -d $BUILD_FLAG

if [ $? -eq 0 ]; then
    print_header "Deployment Status"
    echo -e "${GREEN}Containers are now starting...${NC}"
    docker-compose -f $COMPOSE_FILE ps
    
    print_header "Deployment Complete"
    echo -e "${GREEN}TON Education has been deployed successfully!${NC}"
    
    # Display the URL
    if [ "$deployment_type" = "1" ]; then
        echo -e "${GREEN}You can access the application at: ${YELLOW}http://localhost:5000${NC}"
    else
        echo -e "${GREEN}Your application is now running.${NC}"
        echo -e "${YELLOW}Remember to configure your reverse proxy if needed.${NC}"
    fi
    
    # Show logs option
    if confirm "Would you like to see the logs?"; then
        docker-compose -f $COMPOSE_FILE logs -f
    fi
else
    print_header "Deployment Failed"
    echo -e "${RED}There was an error deploying the application.${NC}"
    echo -e "${YELLOW}Check the error messages above and try again.${NC}"
    exit 1
fi