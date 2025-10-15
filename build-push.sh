#!/bin/bash

# AWS ECR Configuration
AWS_REGION="us-east-2"  # Change to your preferred region
AWS_ACCOUNT_ID="088462465887"  # Your AWS account ID
REPOSITORY_NAME="vendor-portal-api"
IMAGE_TAG="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting Docker build and push process for Vendor Portal...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Get AWS Account ID automatically if not set
if [ "$AWS_ACCOUNT_ID" = "088462465887" ]; then
    echo -e "${GREEN}✅ Using configured AWS Account ID: $AWS_ACCOUNT_ID${NC}"
else
    echo -e "${YELLOW}🔍 Getting AWS Account ID...${NC}"
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to get AWS Account ID. Make sure you're logged in to AWS CLI.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ AWS Account ID: $AWS_ACCOUNT_ID${NC}"
fi

# Set the full repository URI
REPOSITORY_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME"

echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -t $REPOSITORY_NAME:$IMAGE_TAG .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker image built successfully${NC}"

echo -e "${YELLOW}🔑 Logging in to Amazon ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $REPOSITORY_URI

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ECR login failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Successfully logged in to ECR${NC}"

echo -e "${YELLOW}🏷️  Tagging image...${NC}"
docker tag $REPOSITORY_NAME:$IMAGE_TAG $REPOSITORY_URI:$IMAGE_TAG

echo -e "${YELLOW}🚀 Pushing image to ECR...${NC}"
docker push $REPOSITORY_URI:$IMAGE_TAG

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker push failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Successfully pushed image to ECR${NC}"
echo -e "${GREEN}🎉 Image URI: $REPOSITORY_URI:$IMAGE_TAG${NC}"

echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "1. Create an ECS service using this image"
echo -e "2. Or deploy to AWS App Runner using this image URI"
echo -e "3. Image URI for deployment: ${GREEN}$REPOSITORY_URI:$IMAGE_TAG${NC}"
echo -e "4. Your Vendor Portal API is ready for deployment!"