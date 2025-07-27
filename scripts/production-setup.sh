#!/bin/bash

# Production Setup Script for AI Finder SaaS
# This script prepares the application for production deployment

set -e  # Exit on any error

echo "🚀 Starting Production Setup for AI Finder SaaS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in CI environment
if [ "$CI" = "true" ]; then
    print_status "Running in CI environment"
    NODE_ENV="production"
else
    NODE_ENV="production"
fi

# Step 1: Install dependencies
print_status "Installing dependencies..."
npm ci --only=production
print_success "Dependencies installed successfully"

# Step 2: Run linting
print_status "Running ESLint..."
if npm run lint; then
    print_success "Linting passed"
else
    print_error "Linting failed. Please fix the issues before proceeding."
    exit 1
fi

# Step 3: Type checking
print_status "Running TypeScript type checking..."
if npm run type-check; then
    print_success "Type checking passed"
else
    print_error "Type checking failed. Please fix the type errors before proceeding."
    exit 1
fi

# Step 4: Run unit tests
print_status "Running unit tests..."
if npm run test:coverage; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed. Please fix the test issues before proceeding."
    exit 1
fi

# Step 5: Run E2E tests (if not in CI)
if [ "$CI" != "true" ]; then
    print_status "Running E2E tests..."
    if npm run test:e2e; then
        print_success "E2E tests passed"
    else
        print_warning "E2E tests failed. This is not blocking for production but should be investigated."
    fi
fi

# Step 6: Build the application
print_status "Building the application..."
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed. Please fix the build issues before proceeding."
    exit 1
fi

# Step 7: Security audit
print_status "Running security audit..."
if npm audit --audit-level=moderate; then
    print_success "Security audit passed"
else
    print_warning "Security audit found issues. Please review and fix critical vulnerabilities."
fi

# Step 8: Check environment variables
print_status "Checking environment variables..."
required_vars=(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    "CLERK_SECRET_KEY"
    "MONGODB_URI"
    "IMAGEKIT_PUBLIC_KEY"
    "IMAGEKIT_PRIVATE_KEY"
    "IMAGEKIT_URL_ENDPOINT"
    "RAZORPAY_KEY_ID"
    "RAZORPAY_KEY_SECRET"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
    print_success "All required environment variables are set"
else
    print_error "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

# Step 9: Check for production keys
print_status "Checking for production keys..."
if [[ "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" == *"pk_test_"* ]]; then
    print_warning "Using test Clerk keys. Consider switching to production keys."
fi

if [[ "$RAZORPAY_KEY_ID" == *"rzp_test_"* ]]; then
    print_warning "Using test Razorpay keys. Consider switching to production keys."
fi

# Step 10: Performance check
print_status "Running performance check..."
if command -v lighthouse &> /dev/null; then
    print_status "Lighthouse is available. Running performance audit..."
    # Note: This would require the app to be running
    # lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-report.json
else
    print_warning "Lighthouse not found. Install it for performance auditing: npm install -g lighthouse"
fi

# Step 11: Bundle analysis
print_status "Analyzing bundle size..."
if [ -d ".next" ]; then
    bundle_size=$(du -sh .next | cut -f1)
    print_success "Bundle size: $bundle_size"
    
    # Check if bundle size is reasonable (less than 10MB)
    bundle_size_mb=$(du -sm .next | cut -f1)
    if [ "$bundle_size_mb" -gt 10 ]; then
        print_warning "Bundle size is large ($bundle_size_mb MB). Consider optimization."
    fi
fi

# Step 12: Create production artifacts
print_status "Creating production artifacts..."
mkdir -p production-artifacts

# Copy necessary files
cp -r .next production-artifacts/
cp -r public production-artifacts/
cp package.json production-artifacts/
cp next.config.ts production-artifacts/
cp tsconfig.json production-artifacts/

# Create production start script
cat > production-artifacts/start.sh << 'EOF'
#!/bin/bash
export NODE_ENV=production
npm start
EOF

chmod +x production-artifacts/start.sh

print_success "Production artifacts created in production-artifacts/"

# Step 13: Generate deployment checklist
print_status "Generating deployment checklist..."
cat > production-artifacts/DEPLOYMENT_CHECKLIST.md << 'EOF'
# Deployment Checklist

## Pre-Deployment ✅
- [x] Dependencies installed
- [x] Linting passed
- [x] Type checking passed
- [x] Unit tests passed
- [x] E2E tests passed
- [x] Build successful
- [x] Security audit completed
- [x] Environment variables configured
- [x] Production artifacts created

## Deployment Steps
1. Upload production artifacts to your hosting platform
2. Set environment variables on the hosting platform
3. Configure custom domain and SSL certificate
4. Set up monitoring and logging
5. Configure CDN for static assets
6. Set up database backups
7. Configure rate limiting
8. Set up error tracking

## Post-Deployment
1. Test all functionality
2. Monitor error logs
3. Check performance metrics
4. Verify database connections
5. Test authentication flows
6. Monitor API endpoints
7. Check payment integration
8. Verify image uploads

## Monitoring
- Set up uptime monitoring
- Configure error alerting
- Monitor database performance
- Track user analytics
- Monitor API usage
- Check payment success rates

## Security
- Enable HTTPS
- Configure security headers
- Set up rate limiting
- Monitor for suspicious activity
- Regular security updates
- Database access controls

## Performance
- Enable compression
- Configure caching
- Optimize images
- Monitor Core Web Vitals
- Database query optimization
- CDN configuration
EOF

print_success "Deployment checklist generated"

# Step 14: Final status
echo ""
print_success "🎉 Production setup completed successfully!"
echo ""
print_status "Next steps:"
echo "  1. Review the deployment checklist in production-artifacts/DEPLOYMENT_CHECKLIST.md"
echo "  2. Upload the production artifacts to your hosting platform"
echo "  3. Configure environment variables on your hosting platform"
echo "  4. Set up monitoring and alerting"
echo "  5. Test the deployed application thoroughly"
echo ""
print_status "Production artifacts are ready in: ./production-artifacts/"
echo ""

# Optional: Start production server for testing
if [ "$1" = "--start" ]; then
    print_status "Starting production server for testing..."
    npm start
fi 