#!/bin/bash

echo "🚀 Starting Production Deployment Fix..."

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

# Check if .env.local exists and has required variables
print_status "Checking environment configuration..."
if [ ! -f .env.local ]; then
    print_error ".env.local file not found!"
    echo "Please create .env.local with the following variables:"
    echo "NEXT_PUBLIC_SUPABASE_URL=your-supabase-url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
    echo "SUPABASE_SERVICE_KEY=your-service-key"
    echo "HUGGINGFACE_API_TOKEN=your-hf-token (optional)"
    exit 1
fi

# Check for required environment variables
required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env.local || grep -q "^$var=your-" .env.local; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_error "Missing or incomplete environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    print_warning "Please update .env.local with actual values"
    exit 1
fi

print_success "Environment configuration looks good"

# Install dependencies
print_status "Installing dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Build the application
print_status "Building application..."
if npm run build; then
    print_success "Application built successfully"
else
    print_error "Build failed"
    exit 1
fi

# Test database connection
print_status "Testing database connection..."
node -e "
const { supabaseAdmin } = require('./src/utils/supabase.js');
(async () => {
  try {
    const { data, error } = await supabaseAdmin.from('behavior_logs').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
})();
" 2>/dev/null

if [ $? -eq 0 ]; then
    print_success "Database connection test passed"
else
    print_error "Database connection test failed"
    print_warning "Please run the SQL script in setup_database.sql in your Supabase dashboard"
    print_warning "Or check your database credentials in .env.local"
fi

# Start the server
print_status "Starting production server on port 3003..."
print_warning "Make sure port 3003 is available"

echo ""
echo "🎉 Setup complete! Starting server..."
echo ""
echo "Access your application at:"
echo "  - Main App: http://localhost:3003"
echo "  - Booking Page: http://localhost:3003/book"
echo ""
echo "To stop the server, press Ctrl+C"
echo ""

# Start the server
npm run dev