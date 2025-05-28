# Filter Safety Scan Results

**Scan Date**: 2025-05-28T05:18:12.099Z
**Files Scanned**: 33
**Total Issues**: 104

## HIGH Issues (56)

### Unsafe .length access (56 instances)

**src/components/ProductMixDashboard.tsx:284**
```typescript
<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
```
🔧 **Fix**: $1?.length ?? 0

**src/components/ProductMixDashboard.tsx:325**
```typescript
style={{ backgroundColor: COLORS[index % COLORS.length] }}
```
🔧 **Fix**: $1?.length ?? 0

**src/components/SprintDashboard.tsx:65**
```typescript
{!validationStatus.passed && validationStatus.errors.length > 0 && (
```
🔧 **Fix**: $1?.length ?? 0

**src/components/SprintDashboard.tsx:79**
```typescript
{validationStatus.warnings.length > 0 && (
```
🔧 **Fix**: $1?.length ?? 0

**src/components/SprintDashboard.tsx:93**
```typescript
{validationStatus.passed && validationStatus.errors.length === 0 && (
```
🔧 **Fix**: $1?.length ?? 0

*... and 51 more instances*

## MEDIUM Issues (14)

### Unsafe .filter calls (4 instances)

**src/components/ui/multi-select.tsx:47**
```typescript
onChange(safeSelected.filter((item) => item !== value));
```
🔧 **Fix**: ($1 ?? []).filter(

**src/components/ui/multi-select.tsx:58**
```typescript
const selectedOptions = options.filter((option) =>
```
🔧 **Fix**: ($1 ?? []).filter(

**src/components/ui/multi-select.tsx:139**
```typescript
? safeSelected.filter((item) => item !== option.value)
```
🔧 **Fix**: ($1 ?? []).filter(

**src/hooks/use-toast.ts:124**
```typescript
toasts: state.toasts.filter((t) => t.id !== action.toastId),
```
🔧 **Fix**: ($1 ?? []).filter(

### Direct array indexing (6 instances)

**src/hooks/useDrillThrough.ts:160**
```typescript
if (data && data.activePayload && data.activePayload[0]) {
```
🔧 **Fix**: $1?.[$2]

**src/hooks/useDrillThrough.ts:161**
```typescript
const ageGroup = data.activePayload[0].payload.age_bucket;
```
🔧 **Fix**: $1?.[$2]

**src/hooks/useDrillThrough.ts:173**
```typescript
if (data && data.activePayload && data.activePayload[0]) {
```
🔧 **Fix**: $1?.[$2]

**src/hooks/useDrillThrough.ts:174**
```typescript
const location = data.activePayload[0].payload.location;
```
🔧 **Fix**: $1?.[$2]

**src/hooks/useDrillThrough.ts:189**
```typescript
drillThroughAge(value.activePayload[0].payload.age_bucket);
```
🔧 **Fix**: $1?.[$2]

*... and 1 more instances*

### Array.from workarounds (4 instances)

**src/utils/safeArray.ts:7**
```typescript
if (value instanceof Set) return Array.from(value || []);
```
🔧 **Fix**: $1 ?? []

**src/utils/safeArray.ts:10**
```typescript
return Array.from(value || []);
```
🔧 **Fix**: $1 ?? []

**src/utils/safety.ts:15**
```typescript
return Array.from(value || []);
```
🔧 **Fix**: $1 ?? []

**src/utils/safety.ts:162**
```typescript
if (value instanceof Set) return Array.from(value || []);
```
🔧 **Fix**: $1 ?? []

## LOW Issues (34)

### Console.error usage (34 instances)

**src/components/DebugPanel.tsx:32**
```typescript
console.error('❌ Supabase connection failed:', error);
```
🔧 **Fix**: Use proper error handling

**src/components/DebugPanel.tsx:45**
```typescript
console.error('❌ Supabase test exception:', err);
```
🔧 **Fix**: Use proper error handling

**src/components/EnhancedGlobalFiltersPanel.tsx:51**
```typescript
console.error('Error loading filter options:', error);
```
🔧 **Fix**: Use proper error handling

**src/components/ErrorBoundary.tsx:35**
```typescript
console.error('ErrorBoundary caught an error:', error, errorInfo);
```
🔧 **Fix**: Use proper error handling

**src/components/ErrorBoundary.tsx:51**
```typescript
console.error('Production error:', {
```
🔧 **Fix**: Use proper error handling

*... and 29 more instances*

## Priority Recommendations

⚠️ **HIGH**: Fix within current sprint
⚡ **MEDIUM**: Address in next sprint
📝 **LOW**: Technical debt, schedule when convenient

## Auto-Fix Commands

```bash
# Run this scanner
node scripts/filter-safety-scanner.js

# Auto-fix safe patterns (review changes!)
sed -i.bak "s/\.length/?.length ?? 0/g" src/**/*.{ts,tsx}
sed -i.bak "s/\.map(/?.map(/g" src/**/*.{ts,tsx}
```