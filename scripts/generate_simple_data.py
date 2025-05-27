import csv
import random
from datetime import datetime, timedelta

# Configuration
START_DATE = datetime(2025, 1, 1)
END_DATE = datetime(2025, 5, 27)
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

# Generate products (matching existing schema)
PRODUCTS = []
pid = 1
for brand in BRANDS:
    # 2-3 products per brand
    num_products = random.randint(2, 3)
    for i in range(num_products):
        PRODUCTS.append({
            'id': pid,
            'name': f"{brand['name']} Product {i+1}",
            'brand_id': brand['id'],
            'price': round(random.uniform(50, 200), 2)
        })
        pid += 1

# Generate transactions with subtotal
transactions = []
tx_id = 1

current_date = START_DATE
while current_date < END_DATE:
    # 50-100 transactions per day
    num_transactions = random.randint(50, 100)
    
    for _ in range(num_transactions):
        # Random time during business hours (6 AM - 10 PM)
        hour = random.randint(6, 22)
        minute = random.randint(0, 59)
        tx_time = current_date.replace(hour=hour, minute=minute)
        
        # Calculate total from items (we'll generate items to match)
        num_items = random.randint(1, 5)
        total = 0
        items_count = 0
        
        # Pre-calculate to get total
        for _ in range(num_items):
            qty = random.randint(1, 3)
            price = round(random.uniform(50, 200), 2)
            total += qty * price
            items_count += qty
        
        transactions.append({
            'id': tx_id,
            'created_at': tx_time.isoformat(),
            'total_amount': round(total, 2),
            'items_count': items_count
        })
        tx_id += 1
    
    current_date += timedelta(days=1)

# Generate transaction_items with subtotal
transaction_items = []
ti_id = 1

# For each transaction, create items
for tx in transactions:
    # 1-5 different products per transaction
    num_products = random.randint(1, 5)
    selected_products = random.sample(PRODUCTS, num_products)
    
    running_total = 0
    items_for_tx = []
    
    for prod in selected_products:
        qty = random.randint(1, 3)
        price = prod['price']
        subtotal = round(qty * price, 2)
        
        items_for_tx.append({
            'id': ti_id,
            'product_id': prod['id'],
            'quantity': qty,
            'subtotal': subtotal,
            'transaction_date': tx['created_at']
        })
        
        running_total += subtotal
        ti_id += 1
    
    # Add items to list
    transaction_items.extend(items_for_tx)

print(f"Generated {len(transactions)} transactions")
print(f"Generated {len(transaction_items)} transaction items")
print(f"Generated {len(PRODUCTS)} products")
print(f"Using {len(BRANDS)} brands")

# Write CSV files
with open('brands_simple.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'name', 'is_tbwa'])
    writer.writeheader()
    writer.writerows(BRANDS)

with open('products_simple.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'name', 'brand_id', 'price'])
    writer.writeheader()
    writer.writerows(PRODUCTS)

with open('transactions_simple.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'created_at', 'total_amount', 'items_count'])
    writer.writeheader()
    writer.writerows(transactions)

with open('transaction_items_simple.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'product_id', 'quantity', 'subtotal', 'transaction_date'])
    writer.writeheader()
    writer.writerows(transaction_items)

print("\nFiles created:")
print("- brands_simple.csv")
print("- products_simple.csv")
print("- transactions_simple.csv")
print("- transaction_items_simple.csv")