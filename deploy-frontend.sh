#!/bin/bash

# Frontend Deployment Script for Vendor Portal
# Deploys React app to S3 with static website hosting

echo "🚀 Deploying Vendor Portal Frontend to AWS S3"
echo "Backend API: https://3b6akxpfpr.us-east-2.awsapprunner.com"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BUCKET_NAME="vendor-portal-frontend-088462465887"
REGION="us-east-2"
AWS_ACCOUNT_ID="088462465887"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "• S3 Bucket: $BUCKET_NAME"
echo "• AWS Region: $REGION"
echo "• AWS Account: $AWS_ACCOUNT_ID"
echo ""

# Step 1: Create production environment file
echo -e "${YELLOW}Step 1: Creating production environment file...${NC}"
cat > .env.production << 'EOF'
REACT_APP_API_BASE_URL=https://3b6akxpfpr.us-east-2.awsapprunner.com
REACT_APP_APP_NAME=Vendor Portal
REACT_APP_VERSION=1.0.0
REACT_APP_CUSTOMER_PORTAL_URL=https://dfjabnv013m4m.cloudfront.net
REACT_APP_ENABLE_DASHBOARD=false
REACT_APP_ENABLE_PRODUCTS=false
GENERATE_SOURCEMAP=false
EOF

echo -e "${GREEN}✅ Production environment file created${NC}"

# Step 2: Install dependencies
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 3: Build the React app
echo -e "${YELLOW}Step 3: Building React application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ React app built successfully${NC}"
echo "Build output in: ./build/"

# Step 4: Create S3 bucket (if not exists)
echo -e "${YELLOW}Step 4: Ensuring S3 bucket exists...${NC}"
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ S3 bucket created successfully${NC}"
else
    echo -e "${YELLOW}ℹ️  S3 bucket already exists, continuing...${NC}"
fi

# Step 5: Configure for static website hosting
echo -e "${YELLOW}Step 5: Configuring static website hosting...${NC}"
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html

echo -e "${GREEN}✅ Static website hosting configured${NC}"

# Step 6: Disable Block Public Access
echo -e "${YELLOW}Step 6: Configuring public access settings...${NC}"
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

echo -e "${GREEN}✅ Public access configured${NC}"

# Step 7: Upload files with proper cache control
echo -e "${YELLOW}Step 7: Uploading files to S3...${NC}"

# Upload JS/CSS with long cache
aws s3 sync build/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --exclude "*.json" \
  --exclude "service-worker.js"

# Upload HTML files with no cache
aws s3 sync build/ s3://$BUCKET_NAME \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html" \
  --exclude "*" \
  --include "*.html"

# Upload JSON and service worker with short cache
aws s3 sync build/ s3://$BUCKET_NAME \
  --cache-control "public, max-age=0, must-revalidate" \
  --exclude "*" \
  --include "*.json" \
  --include "service-worker.js"

echo -e "${GREEN}✅ Files uploaded successfully${NC}"

# Step 8: Set bucket policy for public read
echo -e "${YELLOW}Step 8: Setting public read permissions...${NC}"
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

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to set bucket policy${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Public permissions set${NC}"

# Step 9: Display results
echo ""
echo -e "${GREEN}🎉 Frontend deployment complete!${NC}"
echo ""
echo -e "${BLUE}📋 Your application URLs:${NC}"
echo -e "${GREEN}Frontend:${NC} http://$BUCKET_NAME.s3-website.$REGION.amazonaws.com"
echo -e "${GREEN}Backend API:${NC} https://3b6akxpfpr.us-east-2.awsapprunner.com"
echo -e "${GREEN}API Docs:${NC} https://3b6akxpfpr.us-east-2.awsapprunner.com/docs"
echo ""
echo -e "${YELLOW}📝 Important Notes:${NC}"
echo "1. Test your frontend at the URL above"
echo "2. Update CORS in App Runner if needed:"
echo "   Add: http://$BUCKET_NAME.s3-website.$REGION.amazonaws.com"
echo "3. For HTTPS and custom domain, consider setting up CloudFront"
echo ""
echo -e "${GREEN}✅ Your Vendor Portal is now live!${NC}"