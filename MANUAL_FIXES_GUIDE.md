
# Manual Safety Fixes Required

The following patterns need manual review and fixing:

## 1. Add null checks to array methods

Replace:
```typescript
someArray.map(item => ...)
someArray.forEach(item => ...)
someArray.filter(item => ...)
```

With:
```typescript
(someArray || []).map(item => ...)
(someArray || []).forEach(item => ...)
(someArray || []).filter(item => ...)
```

Or better, use the safety utilities:
```typescript
import { safe } from '@/utils/safety';

safe.map(someArray, item => ...)
safe.forEach(someArray, item => ...)
safe.filter(someArray, item => ...)
```

## 2. Add optional chaining

Replace:
```typescript
if (filters.brands.length > 0)
```

With:
```typescript
if (filters.brands?.length > 0)
```

## 3. Use safety utilities for all filter operations

Replace direct array operations in filter contexts with safety utilities:
```typescript
import { safe, safeArray } from '@/utils/safety';

// Instead of
const brandsArray = Array.from(filters.selectedBrands);

// Use
const brandsArray = safeArray(filters.selectedBrands);
```

## 4. Initialize all arrays in state

Ensure all array properties are initialized:
```typescript
const [state, setState] = useState({
  items: [],        // Never undefined
  selected: [],     // Never undefined
  filters: {
    brands: [],     // Never undefined
    categories: [], // Never undefined
  }
});
```
