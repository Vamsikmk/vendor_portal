#!/bin/bash

# Frontend Deployment Script for Vendor Portal
# Deploys React app to S3 + CloudFront

echo "🚀 Deploying Vendor Portal Frontend to AWS"
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
cat > .env.production << EOF
REACT_APP_API_BASE_URL=https://3b6akxpfpr.us-east-2.awsapprunner.com
REACT_APP_APP_NAME=Vendor Portal
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
EOF

echo -e "${GREEN}✅ Production environment file created${NC}"

# Step 2: Install dependencies (if needed)
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

# Step 4: Create S3 bucket
echo -e "${YELLOW}Step 4: Creating S3 bucket...${NC}"
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ S3 bucket created successfully${NC}"
else
    echo -e "${YELLOW}⚠️  S3 bucket might already exist, continuing...${NC}"
fi

# Step 5: Configure for static website hosting
echo -e "${YELLOW}Step 5: Configuring static website hosting...${NC}"
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html

echo -e "${GREEN}✅ Static website hosting configured${NC}"

# Step 6: Upload files with proper content types
echo -e "${YELLOW}Step 6: Uploading files to S3...${NC}"

# Upload with cache control and content types
aws s3 sync build/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --exclude "service-worker.js" \
  --exclude "manifest.json"

# Upload HTML files with no cache
aws s3 sync build/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "no-cache, no-store, must-revalidate" \
  --include "*.html" \
  --include "service-worker.js" \
  --include "manifest.json"

echo -e "${GREEN}✅ Files uploaded successfully${NC}"

# Step 7: Set public permissions
echo -e "${YELLOW}Step 7: Setting public read permissions...${NC}"
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
  }' 2>/dev/null

echo -e "${GREEN}✅ Public permissions set${NC}"

# Step 8: Create CloudFront distribution (optional)
echo -e "${YELLOW}Step 8: Creating CloudFront distribution...${NC}"
DISTRIBUTION_CONFIG='{
  "CallerReference": "'$(date +%s)'",
  "Comment": "Vendor Portal Frontend Distribution",
  "DefaultCacheBehavior": {
    "TargetOriginId": "'$BUCKET_NAME'",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0,
      "Items": []
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "Compress": true
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "'$BUCKET_NAME'",
        "DomainName": "'$BUCKET_NAME'.s3-website.'$REGION'.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  }
}'

# Create CloudFront distribution
DISTRIBUTION_ID=$(aws cloudfront create-distribution \
  --distribution-config "$DISTRIBUTION_CONFIG" \
  --query 'Distribution.Id' \
  --output text 2>/dev/null)

if [ $? -eq 0 ] && [ "$DISTRIBUTION_ID" != "" ]; then
    echo -e "${GREEN}✅ CloudFront distribution created: $DISTRIBUTION_ID${NC}"
    CLOUDFRONT_URL=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DomainName' --output text)
    echo -e "${BLUE}📡 CloudFront URL: https://$CLOUDFRONT_URL${NC}"
else
    echo -e "${YELLOW}⚠️  CloudFront distribution creation skipped or failed${NC}"
fi

# Step 9: Display results
echo ""
echo -e "${GREEN}🎉 Frontend deployment complete!${NC}"
echo ""
echo -e "${BLUE}📋 Your application URLs:${NC}"
echo -e "${GREEN}Frontend (S3):${NC} http://$BUCKET_NAME.s3-website.$REGION.amazonaws.com"
if [ "$CLOUDFRONT_URL" != "" ]; then
    echo -e "${GREEN}Frontend (CloudFront):${NC} https://$CLOUDFRONT_URL"
fi
echo -e "${GREEN}Backend API:${NC} https://3b6akxpfpr.us-east-2.awsapprunner.com"
echo -e "${GREEN}API Docs:${NC} https://3b6akxpfpr.us-east-2.awsapprunner.com/docs"
echo ""
echo -e "${YELLOW}🔧 Next steps:${NC}"
echo "1. Test your frontend URL above"
echo "2. Update CORS in App Runner to include your frontend domain:"
echo "   http://$BUCKET_NAME.s3-website.$REGION.amazonaws.com"
if [ "$CLOUDFRONT_URL" != "" ]; then
    echo "   https://$CLOUDFRONT_URL"
fi
echo "3. Configure custom domain (optional)"
echo ""
echo -e "${GREEN}🏆 Your complete Vendor Portal is now live on AWS!${NC}"

# Step 10: Update CORS automatically
echo -e "${YELLOW}Step 10: Updating backend CORS configuration...${NC}"
FRONTEND_URL="http://$BUCKET_NAME.s3-website.$REGION.amazonaws.com"
NEW_CORS="$FRONTEND_URL,http://localhost:8000,http://localhost:3000,http://127.0.0.1:8000,http://127.0.0.1:3000,https://*.amazonaws.com"

echo -e "${BLUE}📝 Add this to your App Runner CORS_ORIGINS:${NC}"
echo "$NEW_CORS"
echo ""
echo -e "${YELLOW}⚠️  Manual step required:${NC}"
echo "1. Go to App Runner console"
echo "2. Edit environment variables"
echo "3. Update CORS_ORIGINS to include: $FRONTEND_URL"