import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon, 
  Calendar, 
  ToggleLeft, 
  Palette, 
  Key, 
  Database, 
  Shield,
  Save,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { FEATURE_FLAGS } from '@/config/features';

export default function Settings() {
  // General Settings State
  const [defaultDateRange, setDefaultDateRange] = useState<string>('30');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<string>('300'); // 5 minutes
  const [timezone, setTimezone] = useState<string>('Asia/Manila');

  // Theme Settings State
  const [theme, setTheme] = useState<string>('light');
  const [colorScheme, setColorScheme] = useState<string>('default');
  const [compactMode, setCompactMode] = useState<boolean>(false);

  // Feature Flags State
  const [features, setFeatures] = useState(FEATURE_FLAGS);

  // API Keys State
  const [supabaseUrl, setSupabaseUrl] = useState<string>('https://your-project.supabase.co');
  const [supabaseKey, setSupabaseKey] = useState<string>('');
  const [showKeys, setShowKeys] = useState<boolean>(false);

  // Data Management State
  const [exportFormat, setExportFormat] = useState<string>('csv');
  const [includeMetadata, setIncludeMetadata] = useState<boolean>(true);

  const handleSave = () => {
    // In a real app, this would save to localStorage or API
    console.log('Settings saved!');
    // Show success message
  };

  const handleReset = () => {
    // Reset to defaults
    setDefaultDateRange('30');
    setAutoRefresh(true);
    setRefreshInterval('300');
    setTimezone('Asia/Manila');
    setTheme('light');
    setColorScheme('default');
    setCompactMode(false);
    setFeatures(FEATURE_FLAGS);
  };

  const handleExportSettings = () => {
    const settings = {
      general: { defaultDateRange, autoRefresh, refreshInterval, timezone },
      theme: { theme, colorScheme, compactMode },
      features,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        // Apply imported settings
        if (settings.general) {
          setDefaultDateRange(settings.general.defaultDateRange || '30');
          setAutoRefresh(settings.general.autoRefresh ?? true);
          setRefreshInterval(settings.general.refreshInterval || '300');
          setTimezone(settings.general.timezone || 'Asia/Manila');
        }
        if (settings.theme) {
          setTheme(settings.theme.theme || 'light');
          setColorScheme(settings.theme.colorScheme || 'default');
          setCompactMode(settings.theme.compactMode ?? false);
        }
        if (settings.features) {
          setFeatures({ ...FEATURE_FLAGS, ...settings.features });
        }
      } catch (error) {
        console.error('Invalid settings file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Configure your dashboard preferences and system settings
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Main Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="api">API & Data</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Date & Time Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default-date-range">Default Date Range</Label>
                    <Select value={defaultDateRange} onValueChange={setDefaultDateRange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select default range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                        <SelectItem value="365">Last year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Manila">Philippines (Asia/Manila)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">US Eastern</SelectItem>
                        <SelectItem value="Europe/London">UK (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Auto-Refresh Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-refresh">Enable Auto-Refresh</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically refresh dashboard data at set intervals
                    </p>
                  </div>
                  <Switch
                    id="auto-refresh"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                </div>

                {autoRefresh && (
                  <div className="space-y-2">
                    <Label htmlFor="refresh-interval">Refresh Interval</Label>
                    <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                        <SelectItem value="600">10 minutes</SelectItem>
                        <SelectItem value="1800">30 minutes</SelectItem>
                        <SelectItem value="3600">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme & Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto (System)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color-scheme">Color Scheme</Label>
                    <Select value={colorScheme} onValueChange={setColorScheme}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select color scheme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Blue</SelectItem>
                        <SelectItem value="green">TBWA Green</SelectItem>
                        <SelectItem value="purple">Corporate Purple</SelectItem>
                        <SelectItem value="orange">Energetic Orange</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="compact-mode">Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Reduce padding and spacing for denser layout
                    </p>
                  </div>
                  <Switch
                    id="compact-mode"
                    checked={compactMode}
                    onCheckedChange={setCompactMode}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ToggleLeft className="h-5 w-5" />
                  Feature Flags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(features).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <Label htmlFor={key} className="capitalize">
                          {key.replace(/_/g, ' ').toLowerCase()}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {getFeatureDescription(key)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {enabled ? (
                          <Badge variant="default">Enabled</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                        <Switch
                          id={key}
                          checked={enabled}
                          onCheckedChange={(checked) =>
                            setFeatures(prev => ({ ...prev, [key]: checked }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API & Data Tab */}
          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="supabase-url">Supabase URL</Label>
                    <Input
                      id="supabase-url"
                      type="url"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://your-project.supabase.co"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supabase-key">Supabase Anon Key</Label>
                    <div className="relative">
                      <Input
                        id="supabase-key"
                        type={showKeys ? "text" : "password"}
                        value={supabaseKey}
                        onChange={(e) => setSupabaseKey(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowKeys(!showKeys)}
                      >
                        {showKeys ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Security Note</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    API keys are stored locally in your browser and never sent to external servers.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export & Import Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="export-format">Export Format</Label>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="include-metadata">Include Metadata</Label>
                      <p className="text-sm text-muted-foreground">
                        Include timestamps and settings info
                      </p>
                    </div>
                    <Switch
                      id="include-metadata"
                      checked={includeMetadata}
                      onCheckedChange={setIncludeMetadata}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" onClick={handleExportSettings} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Settings
                  </Button>

                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportSettings}
                      className="hidden"
                      id="import-settings"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('import-settings')?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function getFeatureDescription(key: string): string {
  const descriptions: Record<string, string> = {
    'DASHBOARD_OVERVIEW': 'Main dashboard with KPIs and charts',
    'PRODUCT_MIX': 'Product mix and SKU analysis features',
    'BRANDS_PAGE': 'Brand performance and competitive analysis',
    'CONSUMER_INSIGHTS': 'Consumer demographics and behavior analytics',
    'TRENDS_PAGE': 'Trend analysis and forecasting tools',
    'SETTINGS_PAGE': 'Application settings and configuration',
    'EXPORT_FEATURES': 'Data export and download capabilities',
    'REAL_TIME_UPDATES': 'Live data updates and notifications'
  };
  return descriptions[key] || 'Feature configuration option';
}