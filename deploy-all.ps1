# ============================================
# Vendor Portal - Complete Deployment Script
# Deploys Backend (App Runner) and Frontend (S3)
# Account ID: 088462465887
# Region: us-east-2
# ============================================

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$SkipCacheInvalidation
)

# Colors for output
function Write-Info    { Write-Host $args -ForegroundColor Cyan }
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Err     { Write-Host $args -ForegroundColor Red }

# Configuration
$AWS_ACCOUNT_ID    = "088462465887"
$AWS_REGION        = "us-east-2"
$ECR_REPOSITORY    = "vendor-portal-api"
$ECR_URI           = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY"
$APPRUNNER_SERVICE = "vendor-portal-api"
$S3_BUCKET         = "vendor-portal-frontend-$AWS_ACCOUNT_ID"

Write-Info "=========================================="
Write-Info "Vendor Portal Deployment Script"
Write-Info "=========================================="
Write-Info "Account : $AWS_ACCOUNT_ID"
Write-Info "Region  : $AWS_REGION"
Write-Info ""

# Check AWS credentials
Write-Info "Checking AWS credentials..."
try {
    $identity = aws sts get-caller-identity 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Err "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    }
    Write-Success "AWS credentials verified"
} catch {
    Write-Err "Failed to verify AWS credentials"
    exit 1
}

# ============================================
# BACKEND DEPLOYMENT
# ============================================
if (-not $FrontendOnly) {
    Write-Info ""
    Write-Info "=========================================="
    Write-Info "BACKEND DEPLOYMENT (Docker + App Runner)"
    Write-Info "=========================================="

    # Step 1: ECR Login
    Write-Info "Step 1/5: Logging into ECR..."
    $loginCommand = "aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    Invoke-Expression $loginCommand
    if ($LASTEXITCODE -ne 0) { Write-Err "ECR login failed"; exit 1 }
    Write-Success "ECR login successful"

    # Step 2: Ensure ECR repository exists
    Write-Info "Step 2/5: Ensuring ECR repository exists..."
    $repoExists = aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Info "Creating ECR repository..."
        aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION --image-scanning-configuration scanOnPush=true
        if ($LASTEXITCODE -ne 0) { Write-Err "Failed to create ECR repository"; exit 1 }
        Write-Success "ECR repository created"
    } else {
        Write-Success "ECR repository already exists"
    }

    # Step 3: Build Docker Image
    Write-Info "Step 3/5: Building Docker image..."
    docker build -t $ECR_REPOSITORY .
    if ($LASTEXITCODE -ne 0) { Write-Err "Docker build failed"; exit 1 }
    Write-Success "Docker image built successfully"

    # Step 4: Tag and Push
    Write-Info "Step 4/5: Tagging and pushing Docker image..."
    docker tag "${ECR_REPOSITORY}:latest" "${ECR_URI}:latest"
    docker push "${ECR_URI}:latest"
    if ($LASTEXITCODE -ne 0) { Write-Err "Docker push failed"; exit 1 }
    Write-Success "Docker image pushed to ECR"

    # Step 5: App Runner status
    Write-Info "Step 5/5: Checking App Runner deployment status..."
    Write-Warning "Waiting 30 seconds for App Runner to detect new image..."
    Start-Sleep -Seconds 30

    $serviceStatus = aws apprunner describe-service `
        --service-arn "arn:aws:apprunner:${AWS_REGION}:${AWS_ACCOUNT_ID}:service/${APPRUNNER_SERVICE}" `
        --query 'Service.Status' --output text 2>&1

    if ($serviceStatus -match "OPERATION_IN_PROGRESS") {
        Write-Warning "Deployment in progress..."
        Write-Info "Monitor at: https://console.aws.amazon.com/apprunner/home?region=$AWS_REGION#/services"
    } elseif ($serviceStatus -match "RUNNING") {
        Write-Success "App Runner service is RUNNING"
        Write-Success "Backend URL: https://3b6akxpfpr.us-east-2.awsapprunner.com"
    } else {
        Write-Warning "App Runner status: $serviceStatus"
    }

    Write-Success ""
    Write-Success "BACKEND DEPLOYMENT COMPLETED"
}

# ============================================
# FRONTEND DEPLOYMENT
# ============================================
if (-not $BackendOnly) {
    Write-Info ""
    Write-Info "=========================================="
    Write-Info "FRONTEND DEPLOYMENT (React + S3)"
    Write-Info "=========================================="

    # Step 1: Install dependencies
    if (-not (Test-Path "node_modules")) {
        Write-Info "Step 1/3: Installing npm dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) { Write-Err "npm install failed"; exit 1 }
        Write-Success "Dependencies installed"
    } else {
        Write-Success "Step 1/3: Dependencies already installed"
    }

    # Step 2: Build React app (uses .env.production automatically)
    Write-Info "Step 2/3: Building React application..."
    npm run build
    if ($LASTEXITCODE -ne 0) { Write-Err "React build failed"; exit 1 }
    Write-Success "React build completed (output: build/)"

    # Step 3: Sync to S3
    Write-Info "Step 3/3: Syncing build/ to S3..."
    aws s3 mb "s3://$S3_BUCKET" --region $AWS_REGION 2>$null
    aws s3 website "s3://$S3_BUCKET" --index-document index.html --error-document index.html
    aws s3api put-public-access-block --bucket $S3_BUCKET `
        --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
    aws s3api put-bucket-policy --bucket $S3_BUCKET --policy "{
        `"Version`": `"2012-10-17`",
        `"Statement`": [{
            `"Sid`": `"PublicRead`",
            `"Effect`": `"Allow`",
            `"Principal`": `"*`",
            `"Action`": `"s3:GetObject`",
            `"Resource`": `"arn:aws:s3:::$S3_BUCKET/*`"
        }]
    }"
    aws s3 sync build/ "s3://$S3_BUCKET" --delete
    if ($LASTEXITCODE -ne 0) { Write-Err "S3 sync failed"; exit 1 }
    Write-Success "Files synced to S3"

    Write-Success ""
    Write-Success "FRONTEND DEPLOYMENT COMPLETED"
    Write-Success "Frontend URL: http://$S3_BUCKET.s3-website.$AWS_REGION.amazonaws.com"
}

# ============================================
# SUMMARY
# ============================================
Write-Info ""
Write-Info "=========================================="
Write-Info "DEPLOYMENT SUMMARY"
Write-Info "=========================================="
if (-not $FrontendOnly) {
    Write-Info "Backend (App Runner):"
    Write-Info "  ECR    : $ECR_URI"
    Write-Info "  Service: $APPRUNNER_SERVICE"
    Write-Info "  URL    : https://3b6akxpfpr.us-east-2.awsapprunner.com"
    Write-Info "  Console: https://console.aws.amazon.com/apprunner/home?region=$AWS_REGION#/services"
}
if (-not $BackendOnly) {
    Write-Info "Frontend (S3):"
    Write-Info "  Bucket : $S3_BUCKET"
    Write-Info "  URL    : http://$S3_BUCKET.s3-website.$AWS_REGION.amazonaws.com"
}
Write-Info ""
Write-Success "DEPLOYMENT COMPLETED SUCCESSFULLY!"
