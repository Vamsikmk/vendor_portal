#!/bin/bash

# Quick Frontend Deployment Script for Vendor Portal
# This deploys your React app to S3 + CloudFront

echo "🚀 Quick Deploy Script for Vendor Portal Frontend"
echo "Backend API: https://3b6akxpfpr.us-east-2.awsapprunner.com"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
BUCKET_NAME="vendor-portal-frontend-088462465887"
REGION="us-east-2"

# Step 1: Build the React app
echo -e "${YELLOW}Step 1: Building React application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ React app built successfully${NC}"

# Step 2: Create S3 bucket
echo -e "${YELLOW}Step 2: Creating S3 bucket...${NC}"
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Step 3: Configure for static website hosting
echo -e "${YELLOW}Step 3: Configuring static website hosting...${NC}"
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html

# Step 4: Upload files
echo -e "${YELLOW}Step 4: Uploading files to S3...${NC}"
aws s3 sync build/ s3://$BUCKET_NAME --delete

# Step 5: Set public permissions
echo -e "${YELLOW}Step 5: Setting public read permissions...${NC}"
aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
      }
    ]
  }'

echo ""
echo -e "${GREEN}🎉 Frontend deployment complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Your application URLs:${NC}"
echo "Frontend: http://$BUCKET_NAME.s3-website.$REGION.amazonaws.com"
echo "Backend API: https://3b6akxpfpr.us-east-2.awsapprunner.com"
echo "API Docs: https://3b6akxpfpr.us-east-2.awsapprunner.com/docs"
echo ""
echo -e "${YELLOW}🔧 Next steps:${NC}"
echo "1. Test your frontend URL above"
echo "2. Update CORS in App Runner to include your frontend domain"
echo "3. Configure custom domain (optional)"
echo ""
echo -e "${GREEN}Your Vendor Portal is now live on AWS!${NC}"