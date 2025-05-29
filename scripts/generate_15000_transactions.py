#!/usr/bin/env python3
"""
Generate 15,000 transactions covering all 18 regions of the Philippines
with realistic distribution based on population and economic activity
"""

import csv
import random
from datetime import datetime, timedelta
import uuid
from collections import defaultdict

# All 18 Philippine Regions with realistic population/economic weights
REGIONS = {
    'NCR': {'name': 'National Capital Region', 'weight': 25, 'provinces': ['Metro Manila']},
    'Region I': {'name': 'Ilocos Region', 'weight': 5, 'provinces': ['Ilocos Norte', 'Ilocos Sur', 'La Union', 'Pangasinan']},
    'Region II': {'name': 'Cagayan Valley', 'weight': 3, 'provinces': ['Batanes', 'Cagayan', 'Isabela', 'Nueva Vizcaya', 'Quirino']},
    'Region III': {'name': 'Central Luzon', 'weight': 12, 'provinces': ['Aurora', 'Bataan', 'Bulacan', 'Nueva Ecija', 'Pampanga', 'Tarlac', 'Zambales']},
    'Region IV-A': {'name': 'CALABARZON', 'weight': 15, 'provinces': ['Batangas', 'Cavite', 'Laguna', 'Quezon', 'Rizal']},
    'Region IV-B': {'name': 'MIMAROPA', 'weight': 2, 'provinces': ['Marinduque', 'Occidental Mindoro', 'Oriental Mindoro', 'Palawan', 'Romblon']},
    'Region V': {'name': 'Bicol Region', 'weight': 4, 'provinces': ['Albay', 'Camarines Norte', 'Camarines Sur', 'Catanduanes', 'Masbate', 'Sorsogon']},
    'Region VI': {'name': 'Western Visayas', 'weight': 6, 'provinces': ['Aklan', 'Antique', 'Capiz', 'Guimaras', 'Iloilo', 'Negros Occidental']},
    'Region VII': {'name': 'Central Visayas', 'weight': 8, 'provinces': ['Bohol', 'Cebu', 'Negros Oriental', 'Siquijor']},
    'Region VIII': {'name': 'Eastern Visayas', 'weight': 3, 'provinces': ['Biliran', 'Eastern Samar', 'Leyte', 'Northern Samar', 'Samar', 'Southern Leyte']},
    'Region IX': {'name': 'Zamboanga Peninsula', 'weight': 2, 'provinces': ['Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay']},
    'Region X': {'name': 'Northern Mindanao', 'weight': 4, 'provinces': ['Bukidnon', 'Camiguin', 'Lanao del Norte', 'Misamis Occidental', 'Misamis Oriental']},
    'Region XI': {'name': 'Davao Region', 'weight': 5, 'provinces': ['Davao de Oro', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental', 'Davao Oriental']},
    'Region XII': {'name': 'SOCCSKSARGEN', 'weight': 3, 'provinces': ['Cotabato', 'Sarangani', 'South Cotabato', 'Sultan Kudarat']},
    'Region XIII': {'name': 'Caraga', 'weight': 2, 'provinces': ['Agusan del Norte', 'Agusan del Sur', 'Dinagat Islands', 'Surigao del Norte', 'Surigao del Sur']},
    'CAR': {'name': 'Cordillera Administrative Region', 'weight': 2, 'provinces': ['Abra', 'Apayao', 'Benguet', 'Ifugao', 'Kalinga', 'Mountain Province']},
    'BARMM': {'name': 'Bangsamoro', 'weight': 2, 'provinces': ['Basilan', 'Lanao del Sur', 'Maguindanao', 'Sulu', 'Tawi-Tawi']},
    'NIR': {'name': 'Negros Island Region', 'weight': 2, 'provinces': ['Negros Occidental', 'Negros Oriental']}
}

# Expanded store types with regional variations
STORE_TYPES = ['Urban Sari-sari', 'Rural Sari-sari', 'Barangay Store', 'Highway Store', 'Market Stall', 'Community Store']

# Expanded product catalog with TBWA brands highlighted
PRODUCTS = [
    # TBWA Brands (marked for highlighting)
    {'sku': 'ALK001', 'name': 'Alaska Evap Milk 370ml', 'brand': 'Alaska', 'category': 'Dairy', 'price': 35, 'is_tbwa': True},
    {'sku': 'ALK002', 'name': 'Alaska Sweetened Condensed Milk 300ml', 'brand': 'Alaska', 'category': 'Dairy', 'price': 32, 'is_tbwa': True},
    {'sku': 'ALK003', 'name': 'Alaska Powdered Milk 150g', 'brand': 'Alaska', 'category': 'Dairy', 'price': 45, 'is_tbwa': True},
    {'sku': 'DMF001', 'name': 'Del Monte Tomato Sauce 250g', 'brand': 'Del Monte', 'category': 'Condiments', 'price': 28, 'is_tbwa': True},
    {'sku': 'DMF002', 'name': 'Del Monte Pineapple Juice 240ml', 'brand': 'Del Monte', 'category': 'Beverages', 'price': 25, 'is_tbwa': True},
    {'sku': 'OIS001', 'name': 'Oishi Prawn Crackers 60g', 'brand': 'Oishi', 'category': 'Snacks', 'price': 15, 'is_tbwa': True},
    {'sku': 'OIS002', 'name': 'Oishi Potato Chips 50g', 'brand': 'Oishi', 'category': 'Snacks', 'price': 20, 'is_tbwa': True},
    
    # Competitor brands
    {'sku': 'NES001', 'name': 'Nestle Bear Brand 150g', 'brand': 'Nestle', 'category': 'Dairy', 'price': 48, 'is_tbwa': False},
    {'sku': 'COK001', 'name': 'Coca Cola 1.5L', 'brand': 'Coca-Cola', 'category': 'Beverages', 'price': 55, 'is_tbwa': False},
    {'sku': 'PEP001', 'name': 'Pepsi 1.5L', 'brand': 'Pepsi', 'category': 'Beverages', 'price': 52, 'is_tbwa': False},
    {'sku': 'MAR001', 'name': 'Marlboro Red Pack', 'brand': 'Marlboro', 'category': 'Tobacco', 'price': 145, 'is_tbwa': False},
    {'sku': 'LUC001', 'name': 'Lucky Me Pancit Canton 60g', 'brand': 'Lucky Me', 'category': 'Noodles', 'price': 12, 'is_tbwa': False},
    {'sku': 'ARG001', 'name': 'Argentina Corned Beef 150g', 'brand': 'Argentina', 'category': 'Canned Goods', 'price': 35, 'is_tbwa': False},
    {'sku': 'CEN001', 'name': 'Century Tuna 155g', 'brand': 'Century', 'category': 'Canned Goods', 'price': 38, 'is_tbwa': False},
    {'sku': 'SAN001', 'name': 'San Miguel Beer Pale Pilsen', 'brand': 'San Miguel', 'category': 'Alcoholic Beverages', 'price': 55, 'is_tbwa': False},
    {'sku': 'SAF001', 'name': 'Safeguard Soap 135g', 'brand': 'Safeguard', 'category': 'Personal Care', 'price': 35, 'is_tbwa': False},
    {'sku': 'COL001', 'name': 'Colgate Toothpaste 150ml', 'brand': 'Colgate', 'category': 'Personal Care', 'price': 65, 'is_tbwa': False},
    {'sku': 'PAL001', 'name': 'Palmolive Shampoo 200ml', 'brand': 'Palmolive', 'category': 'Personal Care', 'price': 85, 'is_tbwa': False},
    {'sku': 'DOW001', 'name': 'Downy Fabric Conditioner 25ml', 'brand': 'Downy', 'category': 'Household', 'price': 12, 'is_tbwa': False},
    {'sku': 'ARI001', 'name': 'Ariel Detergent 66g', 'brand': 'Ariel', 'category': 'Household', 'price': 15, 'is_tbwa': False},
    {'sku': 'JOY001', 'name': 'Joy Dishwashing Liquid 250ml', 'brand': 'Joy', 'category': 'Household', 'price': 45, 'is_tbwa': False},
    {'sku': 'MAG001', 'name': 'Maggi Magic Sarap 8g', 'brand': 'Maggi', 'category': 'Condiments', 'price': 5, 'is_tbwa': False},
    {'sku': 'KNO001', 'name': 'Knorr Sinigang Mix 22g', 'brand': 'Knorr', 'category': 'Condiments', 'price': 10, 'is_tbwa': False},
    {'sku': 'NES002', 'name': 'Nescafe 3in1 Original', 'brand': 'Nescafe', 'category': 'Beverages', 'price': 8, 'is_tbwa': False},
    {'sku': 'MIL001', 'name': 'Milo 22g Sachet', 'brand': 'Milo', 'category': 'Beverages', 'price': 10, 'is_tbwa': False},
    {'sku': 'GAR001', 'name': 'Gardenia White Bread', 'brand': 'Gardenia', 'category': 'Bakery', 'price': 58, 'is_tbwa': False},
    {'sku': 'REB001', 'name': 'Rebisco Crackers 10x25g', 'brand': 'Rebisco', 'category': 'Snacks', 'price': 65, 'is_tbwa': False},
    {'sku': 'JBC001', 'name': 'Jack n Jill Chippy 110g', 'brand': 'Jack n Jill', 'category': 'Snacks', 'price': 35, 'is_tbwa': False},
    {'sku': 'PIA001', 'name': 'Piattos Cheese 85g', 'brand': 'Piattos', 'category': 'Snacks', 'price': 40, 'is_tbwa': False},
]

# Customer demographics
AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']
GENDERS = ['Male', 'Female']

# Income segments by region
INCOME_SEGMENTS = {
    'Low': {'range': (3000, 10000), 'weight': 40},
    'Lower-Middle': {'range': (10001, 20000), 'weight': 30},
    'Middle': {'range': (20001, 40000), 'weight': 20},
    'Upper-Middle': {'range': (40001, 80000), 'weight': 8},
    'High': {'range': (80001, 200000), 'weight': 2}
}

def generate_stores(num_stores=500):
    """Generate stores distributed across all regions"""
    stores = []
    store_id = 1
    
    # Calculate stores per region based on weights
    total_weight = sum(r['weight'] for r in REGIONS.values())
    
    for region_code, region_info in REGIONS.items():
        region_stores = int(num_stores * region_info['weight'] / total_weight)
        
        for _ in range(region_stores):
            province = random.choice(region_info['provinces'])
            store_type = random.choice(STORE_TYPES)
            
            stores.append({
                'id': f'STR{store_id:04d}',
                'name': f'{store_type} - {province} #{store_id}',
                'type': store_type,
                'region': region_code,
                'region_name': region_info['name'],
                'province': province,
                'city': f'{province} City',
                'barangay': f'Barangay {random.randint(1, 50)}',
                'latitude': 12.8797 + random.uniform(-8, 8),  # Philippines lat range
                'longitude': 121.7740 + random.uniform(-6, 6),  # Philippines lon range
                'monthly_income': random.randint(50000, 500000)
            })
            store_id += 1
    
    return stores

def generate_customers(num_customers=3000):
    """Generate diverse customer profiles"""
    customers = []
    
    for i in range(num_customers):
        age_group = random.choice(AGE_GROUPS)
        gender = random.choice(GENDERS)
        income_segment = random.choices(
            list(INCOME_SEGMENTS.keys()),
            weights=[s['weight'] for s in INCOME_SEGMENTS.values()]
        )[0]
        
        customers.append({
            'id': f'CUST{i+1:05d}',
            'age_group': age_group,
            'gender': gender,
            'income_segment': income_segment,
            'loyalty_tier': random.choice(['Bronze', 'Silver', 'Gold', 'Platinum'])
        })
    
    return customers

def generate_transactions(stores, customers, num_transactions=15000):
    """Generate 15,000 transactions with realistic patterns"""
    transactions = []
    transaction_items = []
    
    # Start date: 6 months ago
    start_date = datetime.now() - timedelta(days=180)
    
    # Regional shopping patterns
    regional_patterns = {
        'NCR': {'peak_hours': [7, 12, 18], 'avg_basket': 5},
        'Region IV-A': {'peak_hours': [6, 11, 17], 'avg_basket': 4},
        'Region VII': {'peak_hours': [7, 13, 19], 'avg_basket': 4},
        # Add patterns for other regions...
    }
    
    for trans_id in range(1, num_transactions + 1):
        # Select store with weighted probability
        store = random.choice(stores)
        customer = random.choice(customers)
        
        # Generate transaction datetime with realistic patterns
        days_offset = random.randint(0, 180)
        trans_date = start_date + timedelta(days=days_offset)
        
        # Peak hours based on region
        region = store['region']
        if region in regional_patterns:
            peak_hour = random.choice(regional_patterns[region]['peak_hours'])
            hour = peak_hour + random.randint(-2, 2)
            avg_items = regional_patterns[region]['avg_basket']
        else:
            hour = random.randint(6, 21)
            avg_items = 3
        
        hour = max(6, min(21, hour))  # Clamp between 6 AM and 9 PM
        minute = random.randint(0, 59)
        trans_datetime = trans_date.replace(hour=hour, minute=minute)
        
        # Create transaction
        transaction = {
            'id': f'TRX{trans_id:06d}',
            'store_id': store['id'],
            'customer_id': customer['id'],
            'customer_age': customer['age_group'],
            'customer_gender': customer['gender'],
            'transaction_date': trans_datetime.strftime('%Y-%m-%d %H:%M:%S'),
            'amount': 0,  # Will be calculated
            'payment_method': random.choice(['Cash', 'GCash', 'PayMaya', 'Cash', 'Cash']),  # More cash
            'created_at': trans_datetime.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # Generate transaction items
        num_items = max(1, int(random.gauss(avg_items, 1.5)))
        selected_products = random.sample(PRODUCTS, min(num_items, len(PRODUCTS)))
        
        total_amount = 0
        for product in selected_products:
            quantity = random.choices([1, 2, 3, 4, 5], weights=[50, 30, 10, 5, 5])[0]
            line_total = product['price'] * quantity
            total_amount += line_total
            
            transaction_items.append({
                'id': f'TI{trans_id:06d}{len(transaction_items)+1:03d}',
                'transaction_id': transaction['id'],
                'product_sku': product['sku'],
                'product_name': product['name'],
                'brand_name': product['brand'],
                'category': product['category'],
                'quantity': quantity,
                'unit_price': product['price'],
                'line_total': line_total,
                'is_tbwa_brand': product['is_tbwa']
            })
        
        transaction['amount'] = total_amount
        transactions.append(transaction)
        
        if trans_id % 1000 == 0:
            print(f"Generated {trans_id} transactions...")
    
    return transactions, transaction_items

def write_csv_files(stores, customers, transactions, transaction_items):
    """Write all data to CSV files"""
    # Write stores
    with open('scripts/stores_15k.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=stores[0].keys())
        writer.writeheader()
        writer.writerows(stores)
    
    # Write customers
    with open('scripts/customers_15k.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=customers[0].keys())
        writer.writeheader()
        writer.writerows(customers)
    
    # Write transactions
    with open('scripts/transactions_15k.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=transactions[0].keys())
        writer.writeheader()
        writer.writerows(transactions)
    
    # Write transaction items
    with open('scripts/transaction_items_15k.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=transaction_items[0].keys())
        writer.writeheader()
        writer.writerows(transaction_items)

def print_summary(stores, customers, transactions, transaction_items):
    """Print summary statistics"""
    print("\n📊 DATASET GENERATION SUMMARY")
    print("=" * 60)
    print(f"✅ Stores: {len(stores)}")
    print(f"✅ Customers: {len(customers)}")
    print(f"✅ Transactions: {len(transactions)}")
    print(f"✅ Transaction Items: {len(transaction_items)}")
    
    # Regional distribution
    print("\n🗺️  REGIONAL DISTRIBUTION:")
    regional_counts = defaultdict(int)
    for store in stores:
        regional_counts[store['region_name']] += 1
    
    for region, count in sorted(regional_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  - {region}: {count} stores")
    
    # Brand distribution
    print("\n🏷️  TOP BRANDS BY TRANSACTIONS:")
    brand_counts = defaultdict(int)
    tbwa_total = 0
    for item in transaction_items:
        brand_counts[item['brand_name']] += item['quantity']
        if item['is_tbwa_brand']:
            tbwa_total += item['quantity']
    
    for brand, count in sorted(brand_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  - {brand}: {count:,} units")
    
    print(f"\n✨ TBWA Brands Total: {tbwa_total:,} units ({tbwa_total/sum(brand_counts.values())*100:.1f}%)")

if __name__ == "__main__":
    print("🚀 Generating 15,000 transactions for all 18 Philippine regions...")
    
    # Generate data
    stores = generate_stores(500)
    customers = generate_customers(3000)
    transactions, transaction_items = generate_transactions(stores, customers, 15000)
    
    # Write to CSV
    write_csv_files(stores, customers, transactions, transaction_items)
    
    # Print summary
    print_summary(stores, customers, transactions, transaction_items)
    
    print("\n✅ Data generation complete!")
    print("📁 Files created:")
    print("  - scripts/stores_15k.csv")
    print("  - scripts/customers_15k.csv")
    print("  - scripts/transactions_15k.csv")
    print("  - scripts/transaction_items_15k.csv")