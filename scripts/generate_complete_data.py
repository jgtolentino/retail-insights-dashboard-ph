from faker import Faker
import random
import csv
from datetime import datetime, timedelta
import numpy as np

# Initialize Faker
fake = Faker('en_PH')  # Use Philippines locale for more realistic data

# Configuration for synthetic data
START_DATE = datetime(2025, 3, 1)
END_DATE = datetime(2025, 6, 1)  # 3 months of data
TRANS_PER_DAY = (100, 200)       
BASKET_SIZE = (1, 5)             
AGE_RANGE = (18, 65)  # More realistic age range
GENDERS = ['Male', 'Female']  # Simplified for better distribution
STORE_LOCS = ['Manila', 'Cebu', 'Davao', 'Iloilo', 'Baguio', 'Quezon City', 'Makati', 'Pasig']

# Price ranges by category (in PHP)
PRICE_BY_CAT = {
    'snacks': (10.0, 50.0),
    'beverages': (20.0, 100.0),
    'household': (30.0, 200.0),
    'personal_care': (50.0, 300.0),
    'tobacco': (100.0, 200.0)
}

# Define brands based on your Supabase data
BRANDS = [
    {'id': 1, 'name': 'Alaska', 'is_tbwa': False},
    {'id': 2, 'name': 'Bear Brand', 'is_tbwa': False},
    {'id': 3, 'name': 'Champion', 'is_tbwa': False},
    {'id': 4, 'name': 'Fortune', 'is_tbwa': False},
    {'id': 5, 'name': 'Hope', 'is_tbwa': False},
    {'id': 6, 'name': 'Marlboro', 'is_tbwa': False},
    {'id': 7, 'name': 'More', 'is_tbwa': False},
    {'id': 8, 'name': 'Philip Morris', 'is_tbwa': False},
]

# Generate products with better distribution
PRODUCTS = []
pid = 1
for b in BRANDS:
    # Assign primary category based on brand
    if b['name'] in ['Marlboro', 'Philip Morris', 'More', 'Hope', 'Fortune']:
        primary_cat = 'tobacco'
        num_products = 2  # Fewer tobacco products
    elif b['name'] in ['Alaska', 'Bear Brand']:
        primary_cat = 'beverages'
        num_products = 4
    elif b['name'] == 'Champion':
        primary_cat = 'household'
        num_products = 3
    else:
        primary_cat = random.choice(list(PRICE_BY_CAT.keys()))
        num_products = 3
    
    # Create products
    for i in range(num_products):
        PRODUCTS.append({
            'id': pid,
            'brand_id': b['id'],
            'name': f"{b['name']} {primary_cat.replace('_', ' ').title()} Product {i+1}",
            'category': primary_cat
        })
        pid += 1

# Helper functions for realistic data patterns
def get_transaction_weight(hour, day_of_week):
    """Return transaction probability weight based on time"""
    # Peak hours: 10-12, 17-20
    if 10 <= hour <= 12 or 17 <= hour <= 20:
        weight = 2.0
    elif 6 <= hour <= 9 or 13 <= hour <= 16:
        weight = 1.0
    else:
        weight = 0.3
    
    # Weekend boost
    if day_of_week in [5, 6]:  # Saturday, Sunday
        weight *= 1.2
    
    return weight

def get_customer_profile():
    """Generate realistic customer demographics"""
    # Age distribution (weighted towards working age)
    age_weights = {
        (18, 25): 0.25,
        (26, 35): 0.35,
        (36, 45): 0.25,
        (46, 65): 0.15
    }
    
    age_range = random.choices(
        list(age_weights.keys()),
        weights=list(age_weights.values())
    )[0]
    age = random.randint(*age_range)
    
    # Gender distribution (roughly 50/50)
    gender = random.choice(GENDERS)
    
    return age, gender

# Generate data ensuring completeness
transactions = []
transaction_items = []
tx_id = 1
ti_id = 1

# Track data coverage
coverage_tracker = {
    'hours': set(),
    'days_of_week': set(),
    'locations': {loc: 0 for loc in STORE_LOCS},
    'age_groups': {'18-25': 0, '26-35': 0, '36-45': 0, '46-65': 0},
    'genders': {g: 0 for g in GENDERS},
    'categories': {cat: 0 for cat in PRICE_BY_CAT.keys()},
    'brands': {b['id']: 0 for b in BRANDS}
}

current_date = START_DATE
while current_date < END_DATE:
    day_of_week = current_date.weekday()
    coverage_tracker['days_of_week'].add(day_of_week)
    
    # Generate transactions throughout the day
    for hour in range(6, 23):  # 6 AM to 10 PM
        coverage_tracker['hours'].add(hour)
        
        # Number of transactions based on time weight
        base_trans = random.randint(3, 10)
        weight = get_transaction_weight(hour, day_of_week)
        num_trans = int(base_trans * weight)
        
        for _ in range(num_trans):
            created_at = current_date.replace(
                hour=hour,
                minute=random.randint(0, 59),
                second=random.randint(0, 59)
            )
            
            # Customer demographics
            age, gender = get_customer_profile()
            
            # Track demographics
            if 18 <= age <= 25:
                coverage_tracker['age_groups']['18-25'] += 1
            elif 26 <= age <= 35:
                coverage_tracker['age_groups']['26-35'] += 1
            elif 36 <= age <= 45:
                coverage_tracker['age_groups']['36-45'] += 1
            else:
                coverage_tracker['age_groups']['46-65'] += 1
            
            coverage_tracker['genders'][gender] += 1
            
            # Store location (ensure all locations get data)
            if random.random() < 0.1:  # 10% chance to pick underrepresented location
                min_loc = min(coverage_tracker['locations'], 
                            key=coverage_tracker['locations'].get)
                loc = min_loc
            else:
                loc = random.choice(STORE_LOCS)
            coverage_tracker['locations'][loc] += 1
            
            # Add transaction
            transactions.append({
                'id': tx_id,
                'created_at': created_at.isoformat(),
                'total_amount': 0.0,
                'customer_age': age,
                'customer_gender': gender,
                'store_location': loc
            })
            
            # Generate basket ensuring category coverage
            basket_size = random.randint(*BASKET_SIZE)
            basket_total = 0.0
            
            # Ensure at least one item from underrepresented category/brand
            if random.random() < 0.2:  # 20% chance
                min_cat = min(coverage_tracker['categories'], 
                            key=coverage_tracker['categories'].get)
                cat_products = [p for p in PRODUCTS if p['category'] == min_cat]
                if cat_products:
                    prod = random.choice(cat_products)
                    price = round(random.uniform(*PRICE_BY_CAT[prod['category']]), 2)
                    qty = random.randint(1, 3)
                    
                    transaction_items.append({
                        'id': ti_id,
                        'transaction_id': tx_id,
                        'product_id': prod['id'],
                        'quantity': qty,
                        'price': price
                    })
                    
                    basket_total += price * qty
                    coverage_tracker['categories'][prod['category']] += 1
                    coverage_tracker['brands'][prod['brand_id']] += 1
                    ti_id += 1
                    basket_size -= 1
            
            # Fill rest of basket
            for _ in range(basket_size):
                prod = random.choice(PRODUCTS)
                
                # Price with some variation
                base_price = random.uniform(*PRICE_BY_CAT[prod['category']])
                # Add occasional discounts
                if random.random() < 0.1:  # 10% chance of discount
                    price = round(base_price * 0.9, 2)
                else:
                    price = round(base_price, 2)
                
                qty = random.randint(1, 3)
                
                transaction_items.append({
                    'id': ti_id,
                    'transaction_id': tx_id,
                    'product_id': prod['id'],
                    'quantity': qty,
                    'price': price
                })
                
                basket_total += price * qty
                coverage_tracker['categories'][prod['category']] += 1
                coverage_tracker['brands'][prod['brand_id']] += 1
                ti_id += 1
            
            # Update transaction total
            transactions[-1]['total_amount'] = round(basket_total, 2)
            tx_id += 1
    
    current_date += timedelta(days=1)

# Add validation records to ensure all dimensions have data
print("\n=== Data Coverage Report ===")
print(f"Total transactions: {len(transactions)}")
print(f"Total transaction items: {len(transaction_items)}")
print(f"Date range: {START_DATE.date()} to {END_DATE.date()}")
print(f"\nHours covered: {sorted(coverage_tracker['hours'])}")
print(f"Days of week covered: {sorted(coverage_tracker['days_of_week'])}")
print(f"\nLocation distribution:")
for loc, count in coverage_tracker['locations'].items():
    print(f"  {loc}: {count} transactions")
print(f"\nAge group distribution:")
for group, count in coverage_tracker['age_groups'].items():
    print(f"  {group}: {count} customers")
print(f"\nGender distribution:")
for gender, count in coverage_tracker['genders'].items():
    print(f"  {gender}: {count} customers")
print(f"\nCategory coverage:")
for cat, count in coverage_tracker['categories'].items():
    print(f"  {cat}: {count} items sold")
print(f"\nBrand coverage:")
for brand_id, count in coverage_tracker['brands'].items():
    brand_name = next(b['name'] for b in BRANDS if b['id'] == brand_id)
    print(f"  {brand_name}: {count} items sold")

# Write CSVs
transactions_file = 'transactions_complete.csv'
items_file = 'transaction_items_complete.csv'
brands_file = 'brands.csv'
products_file = 'products.csv'

# Write transactions
with open(transactions_file, 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=transactions[0].keys())
    writer.writeheader()
    writer.writerows(transactions)

# Write transaction items
with open(items_file, 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=transaction_items[0].keys())
    writer.writeheader()
    writer.writerows(transaction_items)

# Write brands (for import)
with open(brands_file, 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=BRANDS[0].keys())
    writer.writeheader()
    writer.writerows(BRANDS)

# Write products (for import)
with open(products_file, 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=PRODUCTS[0].keys())
    writer.writeheader()
    writer.writerows(PRODUCTS)

print(f"\n=== Files Generated ===")
print(f"Transactions: {transactions_file}")
print(f"Transaction Items: {items_file}")
print(f"Brands: {brands_file}")
print(f"Products: {products_file}")

# Generate SQL validation queries
print("\n=== Validation SQL Queries ===")
print("""
-- Check data completeness
SELECT 
    COUNT(DISTINCT DATE(created_at)) as days_with_data,
    COUNT(DISTINCT EXTRACT(HOUR FROM created_at)) as hours_covered,
    COUNT(DISTINCT store_location) as locations_covered,
    COUNT(DISTINCT customer_gender) as genders_covered,
    MIN(created_at) as earliest_transaction,
    MAX(created_at) as latest_transaction
FROM transactions;

-- Verify all brands have sales
SELECT 
    b.name,
    COUNT(DISTINCT ti.transaction_id) as transaction_count,
    SUM(ti.quantity * ti.price) as total_sales
FROM brands b
LEFT JOIN products p ON b.id = p.brand_id
LEFT JOIN transaction_items ti ON p.id = ti.product_id
GROUP BY b.id, b.name
ORDER BY b.name;
""")