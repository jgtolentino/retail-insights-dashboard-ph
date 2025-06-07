# Databricks AI Genie Integration for Retail Insights Dashboard

## 🚀 Quick Start

This integration provides seamless connectivity between your Retail Insights Dashboard and Databricks AI Genie, enabling advanced analytics, natural language querying, and AI-powered insights.

### 🎯 One-Click Setup

```bash
# Run the comprehensive integration script
./databricks-ai-genie-integration.sh

# Validate the integration
./test-databricks-integration.sh
```

## ✨ Features

### 🧠 AI-Powered Analytics
- **Natural Language Queries**: Ask questions about your data in plain English
- **Smart Insights**: AI-generated recommendations and trend analysis
- **Interactive Chat**: Conversational interface for data exploration

### 🔄 Hybrid Data Architecture
- **Intelligent Failover**: Automatic switching between Supabase and Databricks
- **Performance Optimization**: Smart caching and query optimization
- **Real-time Monitoring**: Health status of all data sources

### 📊 Enhanced Dashboard Components
- **AI Chat Panel**: Interactive chat interface for data queries
- **System Health Monitor**: Real-time status monitoring
- **Enhanced Widgets**: AI-powered dashboard components with insights

### 🏗️ Medallion Architecture Support
- **Bronze Layer**: Raw data ingestion from multiple sources
- **Silver Layer**: Cleaned and validated data
- **Gold Layer**: Business-ready aggregated analytics

## 📋 Prerequisites

- **Node.js 18+** and **npm**
- **Databricks workspace** with SQL warehouse configured
- **AI Genie enabled** in your Databricks workspace (optional but recommended)
- **Existing Supabase setup** (for hybrid mode)

## 🛠️ Installation

### Step 1: Run Integration Script

```bash
# Make scripts executable
chmod +x databricks-ai-genie-integration.sh
chmod +x test-databricks-integration.sh

# Run the integration
./databricks-ai-genie-integration.sh
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.databricks.template .env.local

# Edit with your Databricks credentials
nano .env.local
```

**Required Environment Variables:**
```env
# Databricks Configuration
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=your-personal-access-token
DATABRICKS_WAREHOUSE_ID=your-sql-warehouse-id

# AI Genie Configuration (optional)
AI_GENIE_ENABLED=true
DATABRICKS_GENIE_SPACE_ID=your-genie-space-id

# Data Source Configuration
PRIMARY_DATA_SOURCE=supabase
FALLBACK_DATA_SOURCE=databricks
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Validate Integration

```bash
# Run comprehensive tests
./test-databricks-integration.sh

# Test specific components
npm run test:databricks
```

### Step 5: Start Development

```bash
npm run dev
```

## 🔧 Configuration Options

### Data Source Priority

```env
# Use Databricks as primary source
PRIMARY_DATA_SOURCE=databricks
FALLBACK_DATA_SOURCE=supabase

# Use Supabase as primary source (default)
PRIMARY_DATA_SOURCE=supabase
FALLBACK_DATA_SOURCE=databricks
```

### AI Features

```env
# Enable AI-powered features
AI_INSIGHTS_ENABLED=true
AI_GENIE_ENABLED=true

# Disable AI features
AI_INSIGHTS_ENABLED=false
```

### Performance Tuning

```env
# Enable caching with 5-minute TTL
DASHBOARD_CACHE_ENABLED=true
DASHBOARD_CACHE_TTL=300000

# Performance monitoring
PERFORMANCE_MONITORING_ENABLED=true
```

## 💻 Usage Examples

### Enhanced Dashboard Widget

```typescript
import { EnhancedDashboardWidget } from '@/components/databricks/EnhancedDashboardWidget';

function Dashboard() {
  return (
    <div>
      <EnhancedDashboardWidget 
        timeRange="30d" 
        className="mb-6" 
      />
    </div>
  );
}
```

### AI Chat Interface

```typescript
import { AIChatPanel } from '@/components/databricks/AIChatPanel';

function DashboardWithChat() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        {/* Main dashboard content */}
      </div>
      <div>
        <AIChatPanel />
      </div>
    </div>
  );
}
```

### System Health Monitor

```typescript
import { SystemHealthMonitor } from '@/components/databricks/SystemHealthMonitor';

function AdminPanel() {
  return (
    <div>
      <SystemHealthMonitor />
    </div>
  );
}
```

### Programmatic Access

```typescript
import { dashboardIntegrationService } from '@/services/databricks/dashboard-integration';

// Get dashboard data with automatic source selection
const data = await dashboardIntegrationService.getDashboardData('30d');

// Ask AI questions
const response = await dashboardIntegrationService.askAIQuestion(
  'What are my top-selling products this month?'
);

// Check system health
const health = await dashboardIntegrationService.getSystemHealth();
```

## 🧪 Testing

### Run All Tests

```bash
# Integration validation
./test-databricks-integration.sh

# Specific test suites
npm run test:databricks      # Databricks integration tests
npm run test:integration     # All integration tests
npm run test:unit           # Unit tests
npm run test:e2e            # End-to-end tests
```

### Health Checks

```bash
# System health check
npm run health:check

# Clear cache
npm run databricks:cache:clear
```

## 📚 Documentation

### Comprehensive Guides
- **[Integration Guide](DATABRICKS_INTEGRATION_GUIDE.md)** - Complete usage documentation
- **[Deployment Instructions](DATABRICKS_DEPLOYMENT_INSTRUCTIONS.md)** - Production deployment guide
- **[Integration Summary](DATABRICKS_INTEGRATION_SUMMARY.md)** - What was installed and configured

### API Documentation

#### DashboardIntegrationService
Main service for unified data access across Supabase and Databricks.

```typescript
interface DashboardIntegrationService {
  getDashboardData(timeRange: string): Promise<IntegratedDashboardData>;
  getTimeSeriesData(timeRange: string): Promise<TimeSeriesData[]>;
  askAIQuestion(question: string): Promise<GenieResponse>;
  getSystemHealth(): Promise<SystemHealth>;
  clearCache(): void;
}
```

#### DatabricksService
Direct Databricks SQL integration.

```typescript
interface DatabricksService {
  initialize(): Promise<void>;
  executeQuery(sql: string): Promise<DatabricksQueryResult>;
  getRetailMetrics(startDate: string, endDate: string): Promise<RetailMetrics>;
  testConnection(): Promise<boolean>;
}
```

#### AIGenieService
Natural language interface powered by Databricks AI Genie.

```typescript
interface AIGenieService {
  askQuestion(query: GenieQuery): Promise<GenieResponse>;
  getInsights(): Promise<GenieInsight[]>;
  generateVisualization(query: string): Promise<any>;
  isEnabled(): boolean;
}
```

## 🎯 Use Cases

### 1. Natural Language Analytics
Ask questions like:
- "What are my top-selling products this month?"
- "Show me customer segments with highest lifetime value"
- "Which products are frequently bought together?"

### 2. Hybrid Data Processing
- **Development**: Use Supabase for rapid prototyping
- **Production**: Scale with Databricks for large datasets
- **Failover**: Automatic switching during outages

### 3. AI-Powered Insights
- Automatic trend detection
- Anomaly alerts
- Predictive recommendations
- Customer segmentation

### 4. Performance Optimization
- Intelligent query caching
- Optimized data access patterns
- Real-time performance monitoring

## 🚨 Troubleshooting

### Common Issues

#### Connection Problems
```
Error: Failed to connect to Databricks
```
**Solution:**
1. Verify `DATABRICKS_HOST` and `DATABRICKS_TOKEN`
2. Check network connectivity
3. Ensure SQL warehouse is running

#### AI Genie Not Working
```
Error: AI Genie service not available
```
**Solution:**
1. Verify AI Genie is enabled in workspace
2. Check `DATABRICKS_GENIE_SPACE_ID`
3. Ensure proper permissions

#### Build Failures
```
Error: Cannot resolve '@databricks/sql'
```
**Solution:**
1. Run `npm install` to install dependencies
2. Clear `node_modules` and reinstall if needed

### Debug Mode

```env
# Enable debug logging
DATABRICKS_DEBUG_ENABLED=true
DATABRICKS_LOG_LEVEL=debug
```

### Check Integration Status

```bash
# View current status
cat databricks-integration-status.json

# View test results
cat integration-test-results.json

# Check logs
tail -f databricks-integration.log
```

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit credentials to version control
2. **Access Tokens**: Rotate Databricks tokens regularly
3. **Least Privilege**: Grant minimal required permissions
4. **Network Security**: Use private endpoints when possible
5. **Audit Logging**: Enable comprehensive audit trails

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Integration   │    │   Data Sources  │
│                 │    │     Layer       │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │  Dashboard  │ │◄──►│ │  Service    │ │◄──►│ │  Supabase   │ │
│ │  Components │ │    │ │  Router     │ │    │ │             │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   AI Chat   │ │◄──►│ │   AI Genie  │ │◄──►│ │ Databricks  │ │
│ │   Interface │ │    │ │   Service   │ │    │ │   + Genie   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📈 Performance Metrics

The integration includes built-in performance monitoring:

- **Query Execution Time**: Track database query performance
- **Data Freshness**: Monitor how recent your data is
- **Cache Hit Rate**: Optimize caching effectiveness
- **System Health**: Real-time status of all components

## 🛣️ Roadmap

### Version 1.1.0 (Planned)
- 🔄 Real-time streaming integration
- 🔄 Advanced ML model integration
- 🔄 Custom dashboard builders
- 🔄 Enhanced visualization options

### Version 1.2.0 (Future)
- 🔄 Multi-workspace support
- 🔄 Advanced security features
- 🔄 Cost optimization tools
- 🔄 Enterprise SSO integration

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Run tests**: `./test-databricks-integration.sh`
4. **Commit changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

## 📄 License

This integration follows the same license as the main project.

## 🆘 Support

- **Documentation**: Check the comprehensive guides in this repository
- **Health Check**: Use the `SystemHealthMonitor` component
- **Test Suite**: Run `./test-databricks-integration.sh` for diagnostics
- **Logs**: Check `databricks-integration.log` for detailed information

---

**🎉 Enjoy your enhanced retail insights dashboard with AI-powered analytics!**

For more detailed information, see the [Integration Guide](DATABRICKS_INTEGRATION_GUIDE.md).