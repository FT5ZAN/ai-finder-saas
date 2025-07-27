#!/bin/bash

# 🚀 AI Finder SaaS - Vercel Deployment Script
# This script prepares your project for deployment to Vercel

set -e  # Exit on any error

echo "🚀 Starting deployment preparation for AI Finder SaaS..."

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Checking Node.js version..."
NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"

print_status "Checking npm version..."
NPM_VERSION=$(npm --version)
print_success "npm version: $NPM_VERSION"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found. Please create it with your environment variables."
    print_status "You can copy from env.example: cp env.example .env.local"
fi

print_status "Installing dependencies..."
npm install

print_status "Running type check..."
npm run type-check

print_status "Running linting..."
npm run lint

print_status "Running tests..."
npm run test:coverage

print_status "Running E2E tests..."
npm run test:e2e

print_status "Building for production..."
npm run build

print_success "✅ Build completed successfully!"

print_status "Checking build output..."
if [ -d ".next" ]; then
    print_success "✅ .next directory created successfully"
else
    print_error "❌ .next directory not found after build"
    exit 1
fi

print_status "Checking for environment variables..."
ENV_VARS=(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    "CLERK_SECRET_KEY"
    "MONGODB_URI_USERS"
    "MONGODB_URI_TOOLS"
    "IMAGEKIT_PUBLIC_KEY"
    "IMAGEKIT_PRIVATE_KEY"
    "IMAGEKIT_URL_ENDPOINT"
    "GROQ_CHATBOT_API_KEY"
    "GROQ_FORM_API_KEY"
    "NEXT_PUBLIC_RAZORPAY_KEY_ID"
    "RAZORPAY_KEY_SECRET"
)

print_status "Required environment variables for Vercel:"
for var in "${ENV_VARS[@]}"; do
    echo "  - $var"
done

print_status "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Please commit them before deploying."
    git status --short
else
    print_success "✅ Working directory is clean"
fi

print_status "Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
print_success "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "You're not on the main branch. Consider switching to main for deployment."
fi

echo ""
echo "🎉 Deployment preparation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Production ready for Vercel deployment'"
echo "   git push origin main"
echo ""
echo "2. Go to https://vercel.com and create a new project"
echo "3. Connect your GitHub repository"
echo "4. Set all environment variables in Vercel dashboard"
echo "5. Click 'Deploy'"
echo ""
echo "📖 For detailed instructions, see: VERCEL_DEPLOYMENT_GUIDE.md"
echo ""
print_success "🚀 Your AI Finder SaaS is ready for deployment!" 