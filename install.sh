#!/bin/bash

# TON Education Installation Script
# This script helps install the TON Education platform

# Color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}== TON Education Installation Script ==${NC}"
echo -e "This script will help you install the TON Education platform."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed.${NC}"
    echo -e "Would you like to install Node.js using NVM? (y/n)"
    read install_node

    if [ "$install_node" = "y" ] || [ "$install_node" = "Y" ]; then
        echo -e "${GREEN}Installing NVM...${NC}"
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
        
        # Source NVM
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        
        # Install Node.js LTS
        nvm install --lts
        nvm use --lts
        
        echo -e "${GREEN}Node.js $(node -v) installed!${NC}"
    else
        echo -e "${RED}Node.js is required. Please install it manually.${NC}"
        exit 1
    fi
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install it manually.${NC}"
    exit 1
fi

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm install

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

# Ask whether to start the application
echo -e "\n${GREEN}Would you like to start the application now? (y/n)${NC}"
read start_app

if [ "$start_app" = "y" ] || [ "$start_app" = "Y" ]; then
    echo -e "${GREEN}Starting the application...${NC}"
    npm run dev
else
    echo -e "\n${GREEN}Installation complete!${NC}"
    echo -e "To start the application, run: ${YELLOW}npm run dev${NC}"
fi

echo -e "\n${GREEN}Thank you for installing TON Education!${NC}"