#!/bin/bash

# Automated Fix Script for JWT user_id Issue
# This script will patch your login endpoint to include user_id in JWT tokens

echo "🔧 JWT user_id Fix - Automated Patcher"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Find the main app file
echo -e "${YELLOW}Step 1: Finding main application file...${NC}"

MAIN_FILE=""
for file in dbRetrievalWithNewMetrics.py main.py app.py api.py; do
    if [ -f "$file" ]; then
        if grep -q "def login_for_access_token" "$file"; then
            MAIN_FILE="$file"
            echo -e "${GREEN}✅ Found login endpoint in: $MAIN_FILE${NC}"
            break
        fi
    fi
done

if [ -z "$MAIN_FILE" ]; then
    echo -e "${RED}❌ Could not find main application file with login endpoint${NC}"
    echo ""
    echo -e "${YELLOW}📝 Manual Fix Required:${NC}"
    echo ""
    echo "Find your /token endpoint (search for 'def login_for_access_token')"
    echo "and change this line:"
    echo ""
    echo -e "${RED}FROM:${NC}"
    echo '  data={"sub": user.username, "role": user.role}'
    echo ""
    echo -e "${GREEN}TO:${NC}"
    echo '  data={"sub": user.username, "role": user.role, "user_id": user.user_id}'
    echo ""
    echo "Then run: ./deploy-backend.sh"
    exit 1
fi

# Check current code
echo ""
echo -e "${YELLOW}Step 2: Checking current code...${NC}"

if grep -q '"user_id": user.user_id' "$MAIN_FILE"; then
    echo -e "${GREEN}✅ Code already has the fix! user_id is included in JWT.${NC}"
    echo ""
    echo -e "${YELLOW}If you're still getting 403 errors:${NC}"
    echo "1. Make sure you've deployed: ./deploy-backend.sh"
    echo "2. Clear browser cache and re-login"
    echo "3. Run diagnostic: ./diagnose-jwt-token.sh"
    exit 0
fi

# Create backup
echo ""
echo -e "${YELLOW}Step 3: Creating backup...${NC}"
BACKUP_FILE="${MAIN_FILE}.backup-$(date +%Y%m%d-%H%M%S)"
cp "$MAIN_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"

# Apply fix
echo ""
echo -e "${YELLOW}Step 4: Applying fix...${NC}"

# Find and replace the data dictionary in create_access_token call
if grep -q 'data={"sub": user.username, "role": user.role}' "$MAIN_FILE"; then
    # Simple case: exact match
    sed -i 's/data={"sub": user\.username, "role": user\.role}/data={"sub": user.username, "role": user.role, "user_id": user.user_id}/g' "$MAIN_FILE"
    echo -e "${GREEN}✅ Fix applied successfully!${NC}"
elif grep -q "data={'sub': user.username, 'role': user.role}" "$MAIN_FILE"; then
    # Alternative quote style
    sed -i "s/data={'sub': user\.username, 'role': user\.role}/data={'sub': user.username, 'role': user.role, 'user_id': user.user_id}/g" "$MAIN_FILE"
    echo -e "${GREEN}✅ Fix applied successfully!${NC}"
else
    echo -e "${RED}❌ Could not automatically apply fix${NC}"
    echo ""
    echo -e "${YELLOW}The code format is different than expected.${NC}"
    echo "Please manually update the login endpoint:"
    echo ""
    echo -e "${BLUE}Add this to the JWT data dictionary:${NC}"
    echo '  "user_id": user.user_id'
    echo ""
    echo "Backup file created at: $BACKUP_FILE"
    exit 1
fi

# Verify fix
echo ""
echo -e "${YELLOW}Step 5: Verifying fix...${NC}"

if grep -q '"user_id": user.user_id' "$MAIN_FILE"; then
    echo -e "${GREEN}✅ Fix verified! user_id will now be included in JWT tokens.${NC}"
else
    echo -e "${RED}❌ Verification failed${NC}"
    echo "Restoring backup..."
    mv "$BACKUP_FILE" "$MAIN_FILE"
    exit 1
fi

# Show diff
echo ""
echo -e "${YELLOW}Step 6: Changes made:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
diff "$BACKUP_FILE" "$MAIN_FILE" || true
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Success
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}         🎉 FIX APPLIED SUCCESSFULLY!    ${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo -e "${BLUE}1. Deploy the fix:${NC}"
echo "   ./deploy-backend.sh"
echo ""
echo -e "${BLUE}2. Wait 10 minutes for deployment${NC}"
echo ""
echo -e "${BLUE}3. In frontend:${NC}"
echo "   • Log out"
echo "   • Clear browser cache (Ctrl+Shift+Delete)"
echo "   • Log in again"
echo ""
echo -e "${BLUE}4. Verify the fix:${NC}"
echo "   ./diagnose-jwt-token.sh"
echo ""
echo -e "${YELLOW}Expected result:${NC}"
echo "   ✅ user_id found: 602"
echo "   ✅ /api/vendor/patients works! (HTTP 200)"
echo ""
echo -e "${GREEN}Your 403 Forbidden error should be fixed!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Backup saved at: $BACKUP_FILE${NC}"
echo "   (Keep this in case you need to revert)"