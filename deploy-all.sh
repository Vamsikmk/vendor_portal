#!/bin/bash

# All-in-One Fix: Verify, Fix, Deploy, and Test
# For "Works locally but not in production" issue

echo "🔧 All-in-One Production Fix Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}Problem: Works locally but 403 Forbidden in production${NC}"
echo -e "${YELLOW}Solution: Deploy your local changes to production${NC}"
echo ""

# Step 1: Find and verify local code
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1: Checking local code...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

MAIN_FILES=("dbRetrievalWithNewMetrics.py" "main.py" "app.py" "api.py")
MAIN_FILE=""

for file in "${MAIN_FILES[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "def login_for_access_token" "$file"; then
            MAIN_FILE="$file"
            echo -e "${GREEN}✅ Found main app file: $MAIN_FILE${NC}"
            break
        fi
    fi
done

if [ -z "$MAIN_FILE" ]; then
    echo -e "${RED}❌ Could not find main app file${NC}"
    echo "Searched for: ${MAIN_FILES[@]}"
    exit 1
fi

# Check if local code has the fix
if grep -q '"user_id": user.user_id' "$MAIN_FILE"; then
    echo -e "${GREEN}✅ Local code has user_id in JWT (good!)${NC}"
else
    echo -e "${YELLOW}⚠️  Local code missing user_id in JWT${NC}"
    echo -e "${YELLOW}Applying fix...${NC}"
    
    # Create backup
    cp "$MAIN_FILE" "$MAIN_FILE.backup-$(date +%Y%m%d-%H%M%S)"
    
    # Apply fix
    if grep -q 'data={"sub": user.username, "role": user.role}' "$MAIN_FILE"; then
        sed -i 's/data={"sub": user\.username, "role": user\.role}/data={"sub": user.username, "role": user.role, "user_id": user.user_id}/g' "$MAIN_FILE"
        echo -e "${GREEN}✅ Fix applied to local code${NC}"
    else
        echo -e "${RED}❌ Could not apply fix automatically${NC}"
        echo "Please manually add this line to your JWT data:"
        echo '  "user_id": user.user_id'
        exit 1
    fi
fi

# Show the relevant code
echo ""
echo -e "${YELLOW}Current JWT creation code:${NC}"
grep -A 3 "create_access_token" "$MAIN_FILE" | grep -A 3 "data=" | head -6

# Step 2: Check deployment prerequisites
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2: Checking deployment prerequisites...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check Docker
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ AWS CLI installed${NC}"

# Check deployment script
if [ ! -f "deploy-backend.sh" ]; then
    echo -e "${RED}❌ deploy-backend.sh not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ deploy-backend.sh found${NC}"

# Check Dockerfile
if [ ! -f "dockerfile" ] && [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Dockerfile not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dockerfile found${NC}"

# Step 3: Confirm deployment
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3: Ready to deploy!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}This will:${NC}"
echo "  1. Build Docker image with your fixed code"
echo "  2. Push to AWS ECR (vendor-portal-api)"
echo "  3. Update App Runner service"
echo "  4. Take 10-15 minutes to complete"
echo ""
echo -e "${YELLOW}What the fix does:${NC}"
echo "  • Adds user_id to JWT tokens"
echo "  • Fixes 403 Forbidden error on /api/vendor/patients"
echo ""

read -p "Continue with deployment? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo ""
    echo -e "${YELLOW}Deployment cancelled${NC}"
    echo ""
    echo -e "${BLUE}To deploy manually:${NC}"
    echo "  ./deploy-backend.sh"
    exit 0
fi

# Step 4: Deploy
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4: Deploying to production...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

chmod +x deploy-backend.sh
./deploy-backend.sh

DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}   ❌ DEPLOYMENT FAILED!${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi

# Step 5: Deployment completed
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✅ DEPLOYMENT COMPLETED!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

CURRENT_TIME=$(date +"%H:%M:%S")
WAIT_UNTIL=$(date -d "+15 minutes" +"%H:%M:%S" 2>/dev/null || date -v+15M +"%H:%M:%S" 2>/dev/null || echo "15 minutes from now")

echo -e "${YELLOW}⏳ CRITICAL NEXT STEPS:${NC}"
echo ""
echo -e "${BLUE}1. Wait for App Runner to deploy${NC}"
echo "   • Current time: $CURRENT_TIME"
echo "   • Wait until: $WAIT_UNTIL (approx)"
echo "   • Monitor at: AWS Console → App Runner → vendor-portal-api"
echo ""
echo -e "${BLUE}2. After deployment completes (15 min):${NC}"
echo ""
echo -e "${GREEN}   a) Open INCOGNITO/PRIVATE browser window:${NC}"
echo "      Chrome: Ctrl+Shift+N"
echo "      Firefox: Ctrl+Shift+P"
echo "      Safari: Cmd+Shift+N"
echo ""
echo -e "${GREEN}   b) Go to your frontend:${NC}"
echo "      http://vendor-portal-frontend-088462465887.s3-website.us-east-2.amazonaws.com"
echo ""
echo -e "${GREEN}   c) Login as vendor${NC}"
echo ""
echo -e "${GREEN}   d) Navigate to: /management/patients${NC}"
echo ""
echo -e "${GREEN}   e) Verify: No more 403 Forbidden error!${NC}"
echo ""
echo -e "${BLUE}3. Run diagnostic to verify:${NC}"
echo "   ./diagnose-jwt-token.sh"
echo ""
echo -e "${GREEN}   Expected result:${NC}"
echo "   ✅ user_id found: XXX"
echo "   ✅ /api/vendor/patients works! (HTTP 200)"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Must use INCOGNITO mode!${NC}"
echo "   Regular browser caches old tokens and code."
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Need help?${NC}"
echo "  • Check deployment: ./verify-deployment.sh"
echo "  • Full guide: cat LOCAL_VS_PRODUCTION.md"
echo "  • AWS Console: https://console.aws.amazon.com/apprunner"
echo ""
echo -e "${GREEN}Your fix is deployed! Wait 15 min and test in incognito mode.${NC}"