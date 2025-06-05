#!/bin/bash

echo "🚀 Starting Local Development Server"
echo "📊 Retail Insights Dashboard - Philippines"
echo "================================"

# Set environment variables for local development
export VITE_SUPABASE_URL=https://lcoxtanyckjzyxxcsjzz.supabase.co
export VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN0.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA
export NODE_ENV=development

echo "✅ Environment variables set"
echo "🔗 Supabase URL: $VITE_SUPABASE_URL"

# Run environment validation
echo "🔍 Validating environment..."
npm run debug:env

# Start development server
echo "🚀 Starting Vite development server..."
echo "📍 Local URL: http://localhost:8080"
echo "📍 Network URL: http://192.168.1.6:8080"
echo ""
echo "🎯 Available Features:"
echo "   📊 Main Dashboard - http://localhost:8080"
echo "   🏢 TBWA Dashboard - http://localhost:8080/tbwa"
echo "   📈 Consumer Insights - http://localhost:8080/consumer-insights"  
echo "   🛒 Product Mix - http://localhost:8080/product-mix"
echo "   🔧 Settings - http://localhost:8080/settings"
echo ""
echo "💡 Project Scout Features Active:"
echo "   ✅ Device Management (18,000+ records)"
echo "   ✅ Health Monitoring"
echo "   ✅ Data Validation Pipeline"
echo "   ✅ TBWA Brand Analytics"
echo ""

npm run dev