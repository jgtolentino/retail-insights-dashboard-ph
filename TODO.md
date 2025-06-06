# 🧩 PHASED ITERATIVE BUILD PLAN (STEP-BY-STEP)

**Retail Insights PH Dashboard** - Complete end-to-end build plan incorporating client brief, current app state audit, and proposed enhancements.

---

## ✅ **PHASE 1: Foundation & Cleanup** 
*Goal: Consolidate tabs, ensure performance, remove redundancy.*

### 🛠 Navigation Reorganization
- [ ] **1.1** Merge `Product Mix` + `Brand Analytics` → `Product Insights`
- [ ] **1.2** Move SKU + Brand filters to unified component  
- [ ] **1.3** Rename and reorder tabs per structure:
  - `Overview` → `Trends Explorer` → `Product Insights` → `Customer Insights` → `Basket Behavior` → `AI Recs`

### 🛠 Remove Redundancies  
- [ ] **1.4** Delete repeated "Category Performance" across tabs
- [ ] **1.5** Collapse daily trend charts into `Trends Explorer` only
- [ ] **1.6** Refactor shared summary widgets to common layout component

### 🛠 UX Fixes
- [ ] **1.7** Add sticky global filters (brand, category, region)
- [ ] **1.8** Audit responsiveness for mobile/tablet

---

## 📊 **PHASE 2: Core KPI & Chart Enhancements**
*Goal: Meet the client visual/insight structure from Keynote.*

### 🛠 Trends Explorer Enhancements
- [ ] **2.1** Add toggle: Day of Week, Weekday vs Weekend, Barangay
- [ ] **2.2** Add box plot / heatmap for transaction time
- [ ] **2.3** Annotate line charts with insights (e.g., "Post-payday spike")

### 🛠 Product Insights Deep Dive
- [ ] **2.4** Add SKU Pareto + category revenue combo
- [ ] **2.5** Create Sankey diagram for **SKU substitution** (A → B)  
- [ ] **2.6** Track substitution via backend `substitution_events` table

### 🛠 Customer Insights Enhancement
- [ ] **2.7** Add geo heatmap by region/barangay
- [ ] **2.8** Enable filters for gender, age band, location
- [ ] **2.9** (Optional) Loyalty flag from transaction history

---

## 🧠 **PHASE 3: Intelligence & Basket Analysis**
*Goal: Deliver AI-driven insights and micro-behavior segmentation.*

### 🛠 Basket Behavior Tab
- [ ] **3.1** Create histogram: basket size (1, 2, 3+ items)
- [ ] **3.2** Add co-purchase heatmap (market basket analysis)
- [ ] **3.3** Highlight frequent pairs (Yosi + Max)

### 🛠 Consumer Behavior Signals  
- [ ] **3.4** Extract **verbatim brand requests** from transcript text
- [ ] **3.5** Build funnel chart: branded ask → suggestion → purchase
- [ ] **3.6** Classify STT transcript data using keyword/NLP logic (spaCy or Regex)

---

## 🤖 **PHASE 4: AI Recommendation Panel**
*Goal: Turn passive data into tactical next steps.*

### 🛠 LLM Integration
- [ ] **4.1** Design prompt schema per tab: "Given top-selling brands and Gen Z share in QC South…"
- [ ] **4.2** Use Claude or GPT-4o via API for generation
- [ ] **4.3** Cache results to prevent token overuse

### 🛠 Frontend Panel
- [ ] **4.4** Add fixed-bottom `AI Recommendation Panel`
- [ ] **4.5** Tab-specific summary with icons + GPT recommendations
- [ ] **4.6** Export/Copy to clipboard button

---

## 🧮 **PHASE 5: Backend & Data Pipeline Additions**

### 🛠 SQL / DB Enhancements
- [ ] **5.1** Add `basket_size` to `SalesInteractions`
- [ ] **5.2** Add `substituted_sku_from`, `substituted_sku_to`
- [ ] **5.3** Add `verbatim_text`, `intent_type`, `suggestion_acceptance`

### 🛠 ETL Pipeline Update
- [ ] **5.4** Python preprocessing for substitution detection
- [ ] **5.5** Audio age bracket tagging
- [ ] **5.6** NLP keyword extraction for brand mentions

---

## 🎨 **PHASE 6: Polish & Final QA**

### 🛠 Visual QA
- [ ] **6.1** Color audit for consistent category colors
- [ ] **6.2** Ensure charts are toggleable (dropdowns, tabs, chips)
- [ ] **6.3** Polish animations or hover states

### 🛠 User Testing & Client Walkthrough
- [ ] **6.4** Prepare walkthrough script
- [ ] **6.5** Add tooltips + "what this means" to explain visuals
- [ ] **6.6** Validate against original Keynote expectations

---

# 🚀 **FINAL OUTPUTS**

By completion, the dashboard will deliver:

✅ **Unified, agency-quality dashboard** matching client vision  
✅ **Storytelling layers** (annotations, LLM summaries)  
✅ **Spatial, temporal, and behavioral insights**  
✅ **Drilldown-ready toggles** with clean layout logic  
✅ **Minimal tab fatigue** and full insight-to-action journey  

---

## 📋 **Progress Tracking**

- **Phase 1**: ✅ **COMPLETE** - Foundation & Cleanup
- **Phase 2**: ⏳ Ready to Start - Core KPI & Chart Enhancements
- **Phase 3**: ⏸️ Pending - Intelligence & Basket Analysis
- **Phase 4**: ⏸️ Pending - AI Recommendation Panel
- **Phase 5**: ⏸️ Pending - Backend & Data Pipeline
- **Phase 6**: ⏸️ Pending - Polish & Final QA

---

**Last Updated**: 2025-06-06  
**Status**: Phase 2 IN PROGRESS ⏳ - Debug System Complete, Analytics Components Active

---

## 🎯 **IMMEDIATE NEXT ITEMS (Priority Queue)**

### High Priority (This Week)
- [ ] **2.4** Complete Brand & SKU Analysis charts (Pareto + category revenue)
- [ ] **2.5** Implement Sankey diagram for SKU substitution tracking
- [ ] **2.7** Add comprehensive geo heatmap by region/barangay

### Medium Priority (Next Week)  
- [ ] **2.8** Customer demographic filters (gender, age band, location)
- [ ] **3.1** Basket size histogram implementation
- [ ] **3.2** Co-purchase heatmap (market basket analysis)

### Future Sprints
- [ ] **ETL Pipeline Integration** - Azure Data Factory + Databricks setup
- [ ] **ServiceNow Ticketing** - ITSM workflow automation
- [ ] **AI/BI Real-time Queries** - Databricks integration for ML insights
- [ ] **ITOps Alignment** - Infrastructure monitoring and change management

---

## 🚀 **ENTERPRISE INTEGRATION ROADMAP**

### Q3 2025: Data Pipeline
- **ETL Implementation** - Full Azure Data Factory pipeline
- **Databricks Unity Catalog** - Medallion architecture (Bronze/Silver/Gold)
- **Real-time Streaming** - IoT device telemetry processing
- **Data Quality Monitoring** - Automated validation and alerts

### Q4 2025: AI/BI Platform
- **ML Model Development** - Demand forecasting, customer segmentation
- **Natural Language Queries** - Conversational dashboard interface
- **ServiceNow Integration** - Automated ticketing and incident management
- **Performance Optimization** - Sub-second response times

### Q1 2026: Enterprise Scale
- **ERP Integration** - SAP/Oracle real-time connections
- **Multi-tenant Architecture** - Client-specific deployments
- **Global Compliance** - GDPR, data residency, security
- **Advanced Analytics** - Predictive modeling and recommendations