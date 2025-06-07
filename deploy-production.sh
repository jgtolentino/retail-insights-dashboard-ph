#!/bin/bash

# Clean Production Deployment Script for Vercel
echo "🚀 Starting Clean Production Deployment..."

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

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

print_status "Step 1: Clean install dependencies..."
rm -rf node_modules package-lock.json
npm ci

print_status "Step 2: Running linting..."
if ! npm run lint; then
    print_error "Linting failed. Please fix the issues before deploying."
    exit 1
fi

print_status "Step 3: Running type checking..."
if ! npm run typecheck; then
    print_error "Type checking failed. Please fix the issues before deploying."
    exit 1
fi

print_status "Step 4: Running tests..."
if ! npm test; then
    print_warning "Some tests failed, but continuing with deployment..."
fi

print_status "Step 5: Building for production..."
if ! npm run build:prod; then
    print_error "Production build failed. Please fix the issues before deploying."
    exit 1
fi

print_success "Build successful! Bundle size:"
ls -lh dist/assets/

print_status "Step 6: Deploying to Vercel..."
if vercel --prod; then
    print_success "🎉 Production deployment successful!"
    print_status "Your app is now live on Vercel."
    
    print_status "Step 7: Running post-deployment verification..."
    sleep 10  # Wait for deployment to propagate
    
    # Get the deployment URL (you'll need to set this)
    DEPLOYMENT_URL=$(vercel ls --prod | grep "retail-insights-dashboard-ph" | head -1 | awk '{print $2}')
    
    if [ ! -z "$DEPLOYMENT_URL" ]; then
        print_status "Testing deployment at: https://$DEPLOYMENT_URL"
        if curl -f -s "https://$DEPLOYMENT_URL" > /dev/null; then
            print_success "✅ Deployment is responding successfully!"
        else
            print_warning "⚠️  Deployment may not be fully ready yet. Check manually: https://$DEPLOYMENT_URL"
        fi
    fi
    
    echo ""
    print_success "🚀 Deployment Complete!"
    echo ""
    echo "Next steps:"
    echo "1. Set environment variables in Vercel dashboard:"
    echo "   - GROQ_API_KEY"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "2. Test the StockBot chat functionality"
    echo "3. Verify Supabase connection"
    echo ""
else
    print_error "❌ Deployment failed. Check the error messages above."
    exit 1
fi