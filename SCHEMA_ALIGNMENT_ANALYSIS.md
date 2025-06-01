# 🔍 Schema Alignment Analysis & Missing Components

## 📊 Current Data Availability

| Table | Records | Status | Key Insights |
|-------|---------|--------|--------------|
| **transactions** | 18,000 | ✅ **FULLY POPULATED** | All customer demographics available |
| **transaction_items** | 3,746 | ⚠️ **PARTIALLY POPULATED** | Only ~20% of transactions have items |
| **brands** | 89 | ✅ **AVAILABLE** | Ready for brand analysis |
| **products** | 109 | ✅ **AVAILABLE** | Product catalog exists |
| **stores** | 4 | ✅ **AVAILABLE** | Multi-store setup ready |
| **substitutions** | 500 | ✅ **AVAILABLE** | Rich substitution data |
| **request_behaviors** | 0 | ❌ **EMPTY** | Key behavioral data missing |
| **customer_requests** | 0 | ❌ **EMPTY** | Duplicate table, not used |

## 🚨 CRITICAL MISALIGNMENTS

### 1. **Request Behaviors Analytics - MISSING**
**Frontend**: Not implemented
**Backend**: Table exists but empty
**Impact**: Missing core behavioral insights

```sql
-- What we SHOULD be showing
SELECT 
  request_type,
  request_method,
  suggestion_offered,
  suggestion_accepted,
  COUNT(*) as count
FROM request_behaviors 
GROUP BY request_type, request_method, suggestion_offered, suggestion_accepted;
```

### 2. **Product Substitutions - MISSING** 
**Frontend**: Not implemented
**Backend**: 500 records available!
**Impact**: Missing unique differentiator

```sql
-- Available substitution insights we're NOT showing
SELECT 
  p1.name as original_product,
  p2.name as substitute_product,
  s.reason,
  COUNT(*) as frequency
FROM substitutions s
JOIN products p1 ON s.original_product_id = p1.id  
JOIN products p2 ON s.substitute_product_id = p2.id
GROUP BY p1.name, p2.name, s.reason
ORDER BY frequency DESC;
```

### 3. **NLP Processing Status - PARTIALLY MISSING**
**Frontend**: Not shown
**Backend**: All transactions have nlp_processed=false
**Impact**: Processing pipeline visibility missing

### 4. **Store Geographic Analysis - MISSING**
**Frontend**: Basic store filter only
**Backend**: Full geographic data available
**Impact**: Location intelligence unused

## 🛠️ REQUIRED IMPLEMENTATIONS

### High Priority Fixes

#### 1. **Substitution Flow Dashboard**
```typescript
// NEW FILE: src/components/charts/SubstitutionFlow.tsx
interface SubstitutionData {
  originalProduct: string
  substituteProduct: string  
  reason: string
  frequency: number
}

// NEW RPC FUNCTION:
CREATE OR REPLACE FUNCTION get_substitution_flows(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_store_id INT DEFAULT NULL
)
RETURNS TABLE (
  original_product TEXT,
  substitute_product TEXT,
  reason TEXT,
  frequency BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p1.name as original_product,
    p2.name as substitute_product,
    s.reason,
    COUNT(*) as frequency
  FROM substitutions s
  JOIN products p1 ON s.original_product_id = p1.id
  JOIN products p2 ON s.substitute_product_id = p2.id
  JOIN transactions t ON s.transaction_id = t.id
  WHERE (p_start_date IS NULL OR t.created_at >= p_start_date)
    AND (p_end_date IS NULL OR t.created_at <= p_end_date)
    AND (p_store_id IS NULL OR t.store_id = p_store_id)
  GROUP BY p1.name, p2.name, s.reason
  ORDER BY frequency DESC;
END;
$$ LANGUAGE plpgsql;
```

#### 2. **Enhanced Store Analytics**
```typescript
// NEW FILE: src/components/StoreGeographicView.tsx
interface StorePerformanceData {
  storeId: number
  storeName: string
  location: string
  barangay: string
  city: string
  region: string
  coordinates: [number, number]
  metrics: {
    transactionCount: number
    totalRevenue: number
    avgTransactionValue: number
    avgCheckoutTime: number
  }
}
```

#### 3. **Customer Demographics Deep Dive**
Currently showing basic age/gender, missing:
- Age group performance analysis
- Gender-based purchasing patterns  
- Weekend vs weekday behavior by demographics

### Medium Priority Fixes

#### 4. **NLP Processing Dashboard**
```typescript
// NEW FILE: src/components/NLPProcessingStatus.tsx
interface NLPStatus {
  totalTransactions: number
  processedCount: number  
  pendingCount: number
  avgConfidenceScore: number
  processingRate: number
}
```

#### 5. **Transaction Items Coverage**
Only 3,746 of 18,000 transactions have items - need:
- Data quality metrics
- Coverage reporting
- Missing data handling

## 🎯 IMMEDIATE ACTION ITEMS

### 1. Fix Brand Revenue Calculation
Current implementation falls back to simulation because transaction_items is incomplete:

```typescript
// CURRENT ISSUE: src/services/behavioral-dashboard.ts line 274
if (error || !brandSalesData || brandSalesData.length === 0) {
  console.warn('⚠️ Transaction items not available, using brands table directly')
  return await this.getTopBrandsFromBrandsTable(startDate, endDate, storeId)
}
```

**Solution**: Create hybrid approach using both actual transaction_items and estimated brand distribution.

### 2. Add Substitution Insights Page
```bash
# NEW PAGE STRUCTURE
src/pages/SubstitutionInsights.tsx
├── SubstitutionFlow.tsx        # Sankey diagram
├── SubstitutionReasons.tsx     # Reason analysis  
├── PopularSubstitutes.tsx      # Top substitution pairs
└── SubstitutionTrends.tsx      # Time-based patterns
```

### 3. Enhance Consumer Insights
Add missing demographic cross-analysis:

```sql
-- Age group by store performance  
SELECT 
  CASE 
    WHEN customer_age < 25 THEN '18-24'
    WHEN customer_age < 35 THEN '25-34'  
    WHEN customer_age < 45 THEN '35-44'
    WHEN customer_age < 55 THEN '45-54'
    ELSE '55+'
  END as age_group,
  s.region,
  AVG(total_amount) as avg_spend,
  COUNT(*) as transaction_count
FROM transactions t
JOIN stores s ON t.store_id = s.id
WHERE customer_age IS NOT NULL
GROUP BY age_group, s.region;
```

## 📋 IMPLEMENTATION PRIORITY

1. **CRITICAL**: Fix brand revenue calculation hybrid approach
2. **HIGH**: Add substitution flow visualization (unique differentiator) 
3. **HIGH**: Enhanced store geographic analysis
4. **MEDIUM**: Complete customer demographic analysis
5. **MEDIUM**: NLP processing status dashboard
6. **LOW**: Request behaviors (when data becomes available)

## 🔧 Next Steps

1. Implement substitution flow RPC function
2. Create SubstitutionInsights page
3. Enhance store filtering with geographic data
4. Add data quality monitoring for transaction_items
5. Build comprehensive demographic cross-analysis