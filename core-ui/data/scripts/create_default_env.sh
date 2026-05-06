#!/bin/bash

# ANSI color codes
BLUE='\x1b[38;5;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BLUE}Adding application environment variables to your .env file...${NC}"
cat .env.dist >> .env
echo -e "${GREEN}All set!${NC} ${BLUE}Don't forget to keep your .env.dist file up to date!${NC}"