#!/bin/bash

# TON Education Database Backup Script
# This script creates a backup of the PostgreSQL database for TON Education

# Color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo -e "\n${GREEN}== $1 ==${NC}"
}

# Get the current date and time for the backup filename
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="backups"
BACKUP_FILE="${BACKUP_DIR}/ton_education_${DATE}.sql"

print_header "TON Education Database Backup"
echo "This script will create a backup of the PostgreSQL database for TON Education."

# Create the backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    echo -e "${GREEN}Created backup directory: $BACKUP_DIR${NC}"
fi

# Load environment variables
if [ -f ".env" ]; then
    source .env
    echo -e "${GREEN}Loaded environment variables from .env${NC}"
else
    echo -e "${YELLOW}No .env file found. Using default connection values.${NC}"
    # Default PostgreSQL connection parameters
    export PGHOST=${PGHOST:-localhost}
    export PGPORT=${PGPORT:-5432}
    export PGUSER=${PGUSER:-postgres}
    export PGPASSWORD=${PGPASSWORD:-postgres}
    export PGDATABASE=${PGDATABASE:-ton_education}
fi

print_header "Backup Information"
echo -e "Database: ${YELLOW}${PGDATABASE}${NC}"
echo -e "Host: ${YELLOW}${PGHOST}${NC}"
echo -e "Port: ${YELLOW}${PGPORT}${NC}"
echo -e "User: ${YELLOW}${PGUSER}${NC}"
echo -e "Backup File: ${YELLOW}${BACKUP_FILE}${NC}"

print_header "Creating Backup"
echo -e "${GREEN}Running: pg_dump -h ${PGHOST} -p ${PGPORT} -U ${PGUSER} -F p -f ${BACKUP_FILE} ${PGDATABASE}${NC}"

if pg_dump -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -F p -f "${BACKUP_FILE}" "${PGDATABASE}"; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    print_header "Backup Completed"
    echo -e "${GREEN}Backup created successfully at: ${YELLOW}${BACKUP_FILE}${NC}"
    echo -e "${GREEN}Backup size: ${YELLOW}${BACKUP_SIZE}${NC}"
    
    # Create a compressed version
    COMPRESSED_FILE="${BACKUP_FILE}.gz"
    echo -e "${GREEN}Compressing backup...${NC}"
    gzip -f "${BACKUP_FILE}"
    COMPRESSED_SIZE=$(du -h "${COMPRESSED_FILE}" | cut -f1)
    echo -e "${GREEN}Compressed backup created at: ${YELLOW}${COMPRESSED_FILE}${NC}"
    echo -e "${GREEN}Compressed size: ${YELLOW}${COMPRESSED_SIZE}${NC}"
else
    print_header "Backup Failed"
    echo -e "${RED}Failed to create database backup.${NC}"
    echo -e "${YELLOW}Check the error messages above and try again.${NC}"
    exit 1
fi

# Cleanup old backups (keep the latest 10)
print_header "Cleanup"
echo -e "${GREEN}Cleaning up old backups...${NC}"

# Count the number of backup files
NUM_BACKUPS=$(ls -1 "${BACKUP_DIR}"/*.gz 2>/dev/null | wc -l)

if [ "$NUM_BACKUPS" -gt 10 ]; then
    NUM_TO_DELETE=$((NUM_BACKUPS - 10))
    echo -e "${GREEN}Removing ${YELLOW}${NUM_TO_DELETE}${GREEN} oldest backups...${NC}"
    
    # Get the list of oldest files and remove them
    ls -1t "${BACKUP_DIR}"/*.gz | tail -n "$NUM_TO_DELETE" | xargs rm -f
    echo -e "${GREEN}Cleanup completed. Keeping the 10 most recent backups.${NC}"
else
    echo -e "${GREEN}No cleanup needed. Currently have ${YELLOW}${NUM_BACKUPS}${GREEN} backups.${NC}"
fi

print_header "Backup Summary"
echo -e "${GREEN}Backup process completed successfully.${NC}"
echo -e "${GREEN}Backup stored at: ${YELLOW}${COMPRESSED_FILE}${NC}"

# Add instructions for restoration
print_header "Restore Instructions"
echo -e "To restore this backup, run:"
echo -e "${YELLOW}gunzip -c ${COMPRESSED_FILE} | psql -h \$PGHOST -p \$PGPORT -U \$PGUSER \$PGDATABASE${NC}"
echo -e "Or for a clean database:"
echo -e "${YELLOW}gunzip -c ${COMPRESSED_FILE} | psql -h \$PGHOST -p \$PGPORT -U \$PGUSER -d postgres -c 'DROP DATABASE IF EXISTS \$PGDATABASE; CREATE DATABASE \$PGDATABASE;' && gunzip -c ${COMPRESSED_FILE} | psql -h \$PGHOST -p \$PGPORT -U \$PGUSER \$PGDATABASE${NC}"