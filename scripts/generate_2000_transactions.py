from faker import Faker
import random
import csv
from datetime import datetime, timedelta

# Initialize Faker
fake = Faker('en_PH')

# Configuration for EXACTLY 2000 transactions
START_DATE = datetime(2025, 1, 1)
END_DATE = datetime(2025, 5, 31)
TOTAL_TRANSACTIONS = 2000  # Fixed total
BASKET_SIZE = (1, 5)
AGE_RANGE = (18, 65)
GENDERS = ['Male', 'Female']
STORE_LOCS = ['Manila', 'Cebu', 'Davao', 'Iloilo', 'Baguio', 'Quezon City', 'Makati', 'Pasig']

PRICE_BY_CAT = {
    'snacks': (10.0, 50.0),
    'beverages': (20.0, 100.0),
    'household': (30.0, 200.0),
    'personal_care': (50.0, 300.0),
    'tobacco': (100.0, 200.0)
}

# Your existing brands from Supabase
BRANDS = [
    {'id': 1, 'name': 'Alaska', 'is_tbwa': False},
    {'id': 2, 'name': 'Bear Brand', 'is_tbwa': False},
    {'id': 3, 'name': 'Champion', 'is_tbwa': False},
    {'id': 4, 'name': 'Fortune', 'is_tbwa': False},
    {'id': 5, 'name': 'Hope', 'is_tbwa': False},
    {'id': 6, 'name': 'Marlboro', 'is_tbwa': False},
    {'id': 7, 'name': 'More', 'is_tbwa': False},
    {'id': 8, 'name': 'Philip Morris', 'is_tbwa': False}
]

# Generate products
PRODUCTS = []
pid = 1
for b in BRANDS:
    if b['name'] in ['Marlboro', 'Philip Morris', 'More', 'Hope', 'Fortune']:
        categories = ['tobacco']
        num_products = 2
    elif b['name'] in ['Alaska', 'Bear Brand']:
        categories = ['beverages', 'snacks']
        num_products = 3
    elif b['name'] == 'Champion':
        categories = ['household', 'personal_care']
        num_products = 3
    else:
        categories = list(PRICE_BY_CAT.keys())
        num_products = 3
    
    for i, cat in enumerate(categories * (num_products // len(categories) + 1)):
        if i >= num_products:
            break
        PRODUCTS.append({
            'id': pid,
            'brand_id': b['id'],
            'name': f"{b['name']} {cat.replace('_', ' ').title()} #{i+1}",
            'category': cat
        })
        pid += 1

# Calculate days and distribute transactions evenly
total_days = (END_DATE - START_DATE).days + 1
transactions_per_day = TOTAL_TRANSACTIONS / total_days

# Generate exactly 2000 transactions
transactions = []
transaction_items = []
tx_id = 1
ti_id = 1

# Create a list of all dates
all_dates = []
current_date = START_DATE
while current_date <= END_DATE:
    all_dates.append(current_date)
    current_date += timedelta(days=1)

# Distribute 2000 transactions across all dates
transactions_created = 0
day_index = 0

while transactions_created < TOTAL_TRANSACTIONS:
    # Cycle through dates
    transaction_date = all_dates[day_index % len(all_dates)]
    
    # Random time between 6 AM and 10 PM
    hour = random.randint(6, 22)
    created_at = transaction_date + timedelta(
        hours=hour,
        minutes=random.randint(0, 59),
        seconds=random.randint(0, 59)
    )
    
    # Customer details
    age = random.randint(*AGE_RANGE)
    gender = random.choice(GENDERS)
    location = random.choice(STORE_LOCS)
    
    # Create transaction
    transactions.append({
        'id': tx_id,
        'created_at': created_at.isoformat(),
        'total_amount': 0.0,
        'customer_age': age,
        'customer_gender': gender,
        'store_location': location
    })
    
    # Generate basket items
    basket_size = random.randint(*BASKET_SIZE)
    total_amount = 0.0
    
    for _ in range(basket_size):
        prod = random.choice(PRODUCTS)
        price = round(random.uniform(*PRICE_BY_CAT[prod['category']]), 2)
        qty = random.randint(1, 3)
        
        transaction_items.append({
            'id': ti_id,
            'transaction_id': tx_id,
            'product_id': prod['id'],
            'quantity': qty,
            'price': price
        })
        
        total_amount += price * qty
        ti_id += 1
    
    # Update transaction total
    transactions[-1]['total_amount'] = round(total_amount, 2)
    tx_id += 1
    transactions_created += 1
    day_index += 1

# Sort transactions by date for cleaner data
transactions.sort(key=lambda x: x['created_at'])

# Write CSV files
with open('transactions_2000.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'created_at', 'total_amount', 'customer_age', 'customer_gender', 'store_location'])
    writer.writeheader()
    writer.writerows(transactions)

with open('transaction_items_2000.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'transaction_id', 'product_id', 'quantity', 'price'])
    writer.writeheader()
    writer.writerows(transaction_items)

# Summary statistics
print(f"\n=== Generated Data Summary ===")
print(f"Total transactions: {len(transactions)}")
print(f"Total transaction items: {len(transaction_items)}")
print(f"Date range: {START_DATE.strftime('%Y-%m-%d')} to {END_DATE.strftime('%Y-%m-%d')}")
print(f"Days covered: {total_days}")
print(f"Avg transactions per day: {TOTAL_TRANSACTIONS / total_days:.1f}")

# Calculate total revenue
total_revenue = sum(t['total_amount'] for t in transactions)
print(f"\nTotal revenue: ₱{total_revenue:,.2f}")
print(f"Average transaction value: ₱{total_revenue / len(transactions):,.2f}")

# Brand distribution
brand_counts = {}
for item in transaction_items:
    prod = next(p for p in PRODUCTS if p['id'] == item['product_id'])
    brand = next(b for b in BRANDS if b['id'] == prod['brand_id'])
    brand_name = brand['name']
    if brand_name not in brand_counts:
        brand_counts[brand_name] = {'items': 0, 'revenue': 0}
    brand_counts[brand_name]['items'] += item['quantity']
    brand_counts[brand_name]['revenue'] += item['quantity'] * item['price']

print(f"\n=== Brand Performance ===")
for brand, data in sorted(brand_counts.items(), key=lambda x: x[1]['revenue'], reverse=True):
    print(f"{brand}: ₱{data['revenue']:,.2f} ({data['items']} items)")

print(f"\n=== Files Generated ===")
print(f"1. transactions_2000.csv")
print(f"2. transaction_items_2000.csv")