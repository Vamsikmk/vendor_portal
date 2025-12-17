#!/bin/bash

# Backend Deployment Script for Vendor Portal API
# Builds Docker image and deploys to AWS App Runner via ECR

echo "🚀 Deploying Vendor Portal Backend to AWS App Runner"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AWS_REGION="us-east-2"
AWS_ACCOUNT_ID="088462465887"
REPOSITORY_NAME="vendor-portal-api"
IMAGE_TAG="latest"
APP_RUNNER_SERVICE="vendor-portal-api"

# Set the full repository URI
REPOSITORY_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "• AWS Region: $AWS_REGION"
echo "• AWS Account: $AWS_ACCOUNT_ID"
echo "• ECR Repository: $REPOSITORY_NAME"
echo "• Image Tag: $IMAGE_TAG"
echo ""

# Step 1: Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"

# Step 2: Create/Update ECR Repository
echo -e "${YELLOW}Step 2: Ensuring ECR repository exists...${NC}"
aws ecr describe-repositories --repository-names $REPOSITORY_NAME --region $AWS_REGION &> /dev/null

if [ $? -ne 0 ]; then
    echo "Creating ECR repository..."
    aws ecr create-repository \
        --repository-name $REPOSITORY_NAME \
        --region $AWS_REGION \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to create ECR repository${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ ECR repository created${NC}"
else
    echo -e "${GREEN}✅ ECR repository already exists${NC}"
fi

# Step 3: Build Docker image
echo -e "${YELLOW}Step 3: Building Docker image...${NC}"
docker build -t $REPOSITORY_NAME:$IMAGE_TAG .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker image built successfully${NC}"

# Step 4: Login to ECR
echo -e "${YELLOW}Step 4: Logging in to Amazon ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $REPOSITORY_URI

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ECR login failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Successfully logged in to ECR${NC}"

# Step 5: Tag image
echo -e "${YELLOW}Step 5: Tagging image...${NC}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
docker tag $REPOSITORY_NAME:$IMAGE_TAG $REPOSITORY_URI:$IMAGE_TAG
docker tag $REPOSITORY_NAME:$IMAGE_TAG $REPOSITORY_URI:$TIMESTAMP

echo -e "${GREEN}✅ Image tagged with 'latest' and '$TIMESTAMP'${NC}"

# Step 6: Push to ECR
echo -e "${YELLOW}Step 6: Pushing image to ECR...${NC}"
docker push $REPOSITORY_URI:$IMAGE_TAG

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker push failed for 'latest' tag${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pushed 'latest' tag${NC}"

docker push $REPOSITORY_URI:$TIMESTAMP

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker push failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Successfully pushed image to ECR${NC}"

# Step 7: Display results
echo ""
echo -e "${GREEN}🎉 Backend deployment complete!${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Details:${NC}"
echo -e "${GREEN}Image URI:${NC} $REPOSITORY_URI:$IMAGE_TAG"
echo -e "${GREEN}Backend API:${NC} https://3b6akxpfpr.us-east-2.awsapprunner.com"
echo -e "${GREEN}API Docs:${NC} https://3b6akxpfpr.us-east-2.awsapprunner.com/docs"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Go to AWS App Runner console"
echo "2. Update the service to use the new image"
echo "3. Or create new deployment using:"
echo -e "   ${BLUE}Image URI: $REPOSITORY_URI:$IMAGE_TAG${NC}"
echo ""
echo -e "${YELLOW}⚡ Auto-deployment option:${NC}"
echo "App Runner can automatically deploy when you push to ECR."
echo "Make sure auto-deployment is enabled in your App Runner service."
echo ""
echo -e "${GREEN}✅ Your Vendor Portal API is ready!${NC}"