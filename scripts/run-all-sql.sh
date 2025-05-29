#!/bin/bash

# Script to execute all SQL files in Supabase
# Requires SUPABASE_DB_URL environment variable

echo "🚀 Starting comprehensive data import..."
echo "=================================="

# Check if environment variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables"
    echo "Please set these in your .env file"
    exit 1
fi

# Construct database URL from Supabase URL
SUPABASE_PROJECT_REF=$(echo $VITE_SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
SUPABASE_DB_URL="postgresql://postgres.[YOUR-DATABASE-PASSWORD]@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"

echo "📝 Note: You need to replace [YOUR-DATABASE-PASSWORD] with your actual database password"
echo "You can find this in your Supabase dashboard under Settings > Database"
echo ""
echo "The scripts will create:"
echo "  ✅ Hierarchical company/brand structure"
echo "  ✅ Product category hierarchy (Department → Category → Subcategory → SKU)"
echo "  ✅ Customer segmentation (Segments → Subsegments → Personas)"
echo "  ✅ Enhanced location hierarchy (Island Groups → Regions → Barangays)"
echo "  ✅ 50,000 transactions with Filipino patterns"
echo "  ✅ Store classifications and formats"
echo ""
echo "To run the scripts manually:"
echo ""
echo "1. Go to Supabase SQL Editor (https://app.supabase.com/project/${SUPABASE_PROJECT_REF}/sql)"
echo ""
echo "2. Run the hierarchical structure script first:"
echo "   - Copy contents from: scripts/create_hierarchical_structure.sql"
echo "   - Paste and execute in SQL Editor"
echo ""
echo "3. Then run the Philippine data generation script:"
echo "   - Copy contents from: scripts/generate_philippine_data.sql" 
echo "   - Paste and execute in SQL Editor"
echo ""
echo "4. Or use psql directly:"
echo "   psql \"\$SUPABASE_DB_URL\" < scripts/create_hierarchical_structure.sql"
echo "   psql \"\$SUPABASE_DB_URL\" < scripts/generate_philippine_data.sql"
echo ""
echo "Press Enter to see the summary of what will be created..."
read

cat << 'EOF'

📊 DATA SUMMARY AFTER IMPORT:
============================

🏢 Company Structure:
- 4 Company Groups (TBWA Clients, Competitors, Local, International)
- 10+ Companies with divisions
- Brand tier classification (Premium → Economy)

📦 Product Hierarchy:
- 5 Departments (Food & Bev, Personal Care, etc.)
- 15+ Categories
- 30+ Subcategories  
- Products with SKU variants

👥 Customer Segments:
- 4 Main Segments (Premium → Subsistence)
- 6+ Subsegments with personas
- Behavioral characteristics

🗺️ Geographic Coverage:
- 3 Island Groups
- 18 Regions
- 80+ Real Barangays
- 150+ Stores

💳 Transaction Data:
- 50,000 transactions (Jun 2024 - May 2025)
- Filipino language transcriptions
- Time-based shopping patterns
- Substitution tracking

🔍 Analytics Features:
- Multi-level drill-down views
- Hierarchical aggregation functions
- Cross-dimensional analysis
- Real-time insights

EOF