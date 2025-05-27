# Data Generation and Import Scripts

This directory contains scripts to generate realistic test data and import it into your Supabase database.

## Prerequisites

- Python 3.8+ with `faker` library
- Node.js 18+
- Your Supabase project set up with the required tables

## Installation

1. Install Python dependencies:
   ```bash
   pip install faker
   ```

2. Install Node.js dependencies:
   ```bash
   cd scripts
   npm install
   ```

## Usage

### Option 1: One-Command Setup (Recommended)

```bash
npm run seed
```

This will:
1. Generate CSV files with complete test data
2. Import all data into your Supabase database

### Option 2: Step by Step

1. **Generate test data:**
   ```bash
   python generate_complete_data.py
   ```
   
   This creates:
   - `brands.csv` - 8 brands
   - `products.csv` - ~25 products across categories
   - `transactions_complete.csv` - ~45,000 transactions over 3 months
   - `transaction_items_complete.csv` - ~150,000+ transaction items

2. **Import to Supabase:**
   ```bash
   node import_to_supabase.js
   ```

## Data Characteristics

The generated data includes:
- **Time Coverage**: March 1 - June 1, 2025 (3 months)
- **Business Hours**: 6 AM - 10 PM daily
- **Peak Hours**: 10-12 AM and 5-8 PM
- **Locations**: 8 Philippine cities
- **Demographics**: Realistic age and gender distributions
- **Products**: Multiple categories (tobacco, beverages, household, etc.)
- **Pricing**: Realistic Philippine peso amounts with occasional discounts

## Verification

After import, the script will show:
- Total records imported for each table
- Date range of transactions
- Sales summary by brand

## Troubleshooting

1. **"File not found" error**: Make sure you run the Python script first
2. **Authentication error**: Check your Supabase credentials in `.env.local`
3. **Foreign key errors**: The import script clears data in the correct order

## Manual Import via Supabase Dashboard

If you prefer to import manually:
1. Go to your Supabase project
2. Navigate to Table Editor
3. Click Insert → Import from CSV
4. Upload files in this order:
   - brands.csv
   - products.csv
   - transactions_complete.csv
   - transaction_items_complete.csv