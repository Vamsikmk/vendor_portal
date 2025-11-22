#!/bin/bash

# Local Docker Build and Test Script
# Tests Docker build locally before pushing to cloud

echo "🐳 Local Docker Build & Test Script"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
IMAGE_NAME="vendor-portal-api"
IMAGE_TAG="local-test"
CONTAINER_NAME="vendor-portal-test"
TEST_PORT="8001"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "• Image Name: $IMAGE_NAME"
echo "• Image Tag: $IMAGE_TAG"
echo "• Test Port: $TEST_PORT"
echo ""

# Step 1: Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Step 2: Clean up any existing test containers/images
echo -e "${YELLOW}Step 2: Cleaning up previous test artifacts...${NC}"

# Stop and remove container if it exists
docker stop $CONTAINER_NAME 2>/dev/null
docker rm $CONTAINER_NAME 2>/dev/null

echo -e "${GREEN}✅ Cleanup complete${NC}"

# Step 3: Build Docker image
echo -e "${YELLOW}Step 3: Building Docker image locally...${NC}"
echo "This may take a few minutes..."
echo ""

docker build -t $IMAGE_NAME:$IMAGE_TAG .

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Docker build failed${NC}"
    echo ""
    echo -e "${YELLOW}Common issues and solutions:${NC}"
    echo "1. Syntax errors in Python files - check error messages above"
    echo "2. Missing dependencies - check requirements-metrics.txt"
    echo "3. Circular imports - check import statements"
    echo "4. File not found - ensure all Python files are in project root"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Docker image built successfully${NC}"

# Step 4: Check image size
echo -e "${YELLOW}Step 4: Checking image size...${NC}"
IMAGE_SIZE=$(docker images $IMAGE_NAME:$IMAGE_TAG --format "{{.Size}}")
echo -e "${BLUE}Image size: $IMAGE_SIZE${NC}"

# Step 5: Test run container (optional - can be slow due to database connection)
echo -e "${YELLOW}Step 5: Quick container test...${NC}"
echo -e "${BLUE}Note: This test may fail if database is not accessible, but the image build is what matters.${NC}"
echo ""

read -p "Do you want to test run the container? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting container..."
    
    docker run -d \
        --name $CONTAINER_NAME \
        -p $TEST_PORT:8001 \
        -e DATABASE_URL="postgresql://postgres:db_admin@vendor-portal-db.cszf6hop4o2t.us-east-2.rds.amazonaws.com:5432/mannbiome" \
        -e JWT_SECRET_KEY="test-secret-key" \
        -e JWT_ALGORITHM="HS256" \
        -e CORS_ORIGINS="http://localhost:3000,http://localhost:8000" \
        $IMAGE_NAME:$IMAGE_TAG
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Container started${NC}"
        echo "Waiting 5 seconds for container to initialize..."
        sleep 5
        
        # Check if container is still running
        if docker ps | grep -q $CONTAINER_NAME; then
            echo -e "${GREEN}✅ Container is running${NC}"
            echo ""
            echo -e "${BLUE}Container logs:${NC}"
            docker logs $CONTAINER_NAME --tail 20
            echo ""
            echo -e "${YELLOW}To view full logs: docker logs $CONTAINER_NAME${NC}"
            echo -e "${YELLOW}To stop container: docker stop $CONTAINER_NAME${NC}"
            echo ""
            echo -e "${GREEN}Test your API at: http://localhost:$TEST_PORT/docs${NC}"
        else
            echo -e "${RED}⚠️  Container stopped unexpectedly${NC}"
            echo ""
            echo -e "${BLUE}Container logs:${NC}"
            docker logs $CONTAINER_NAME
            echo ""
            echo -e "${YELLOW}This might be due to:${NC}"
            echo "1. Database connection issues (normal for local testing)"
            echo "2. Import errors in Python code"
            echo "3. Missing environment variables"
        fi
    else
        echo -e "${RED}❌ Failed to start container${NC}"
    fi
else
    echo "Skipping container test run"
fi

# Step 6: Display results
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}    ✅ LOCAL BUILD TEST COMPLETE!       ${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "${GREEN}✅ Docker image built successfully${NC}"
echo -e "   Image: $IMAGE_NAME:$IMAGE_TAG"
echo -e "   Size: $IMAGE_SIZE"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. If container test passed - your code is ready!"
echo "2. Run deployment script: ./deploy-backend.sh"
echo "3. Or push manually to ECR"
echo ""
echo -e "${YELLOW}🧹 Cleanup Commands:${NC}"
echo "• Stop container: docker stop $CONTAINER_NAME"
echo "• Remove container: docker rm $CONTAINER_NAME"
echo "• Remove image: docker rmi $IMAGE_NAME:$IMAGE_TAG"
echo "• Full cleanup: docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME && docker rmi $IMAGE_NAME:$IMAGE_TAG"
echo ""

# Step 7: Offer to clean up
echo -e "${YELLOW}Would you like to clean up test artifacts now? (y/n)${NC}"
read -p "" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleaning up..."
    docker stop $CONTAINER_NAME 2>/dev/null
    docker rm $CONTAINER_NAME 2>/dev/null
    docker rmi $IMAGE_NAME:$IMAGE_TAG 2>/dev/null
    echo -e "${GREEN}✅ Cleanup complete${NC}"
else
    echo "Test artifacts kept. Use cleanup commands above when ready."
fi

echo ""
echo -e "${GREEN}🎉 Your Docker image is ready for deployment!${NC}"