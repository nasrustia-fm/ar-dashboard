
'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from '@/components/metric-card';
import { LineChartComponent } from '@/components/charts/line-chart';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  RefreshCw,
  AlertCircle,
  PieChart,
  LineChart,
  Zap
} from 'lucide-react';

interface MetricData {
  current: number | null;
  weekOverWeek: {
    absolute: number | null;
    percentage: number | null;
  };
  trailingAverages: {
    threeMonth: number | null;
    sixMonth: number | null;
    twelveMonth: number | null;
  };
}

interface ApiResponse {
  currentWeek: string;
  metrics: {
    overdueGmv: MetricData;
    collectedGmv: MetricData;
    collectedInvoices: MetricData;
    dso: MetricData;
    weightedAvgDaysOverdue: MetricData;
    weightedAvgDaysLate: MetricData;
    creditSalesPercent: MetricData;
    cei: MetricData;
    arTurnoverRatio: MetricData;
  };
  dataPoints: number;
}

interface HistoricalData {
  week: string;
  overdueGmv: number | null;
  collectedGmv: number;
  collectedInvoices: number;
  dso: number | null;
  weightedAvgDaysOverdue: number | null;
  weightedAvgDaysLate: number | null;
  creditSalesPercent: number | null;
  cei: number | null;
  arTurnoverRatio: number | null;
}

export default function AnalyticsPage() {
  const [metricsData, setMetricsData] = useState<ApiResponse | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('12');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const metricsResponse = await fetch('/api/ar-metrics');
      if (!metricsResponse.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const metricsResult = await metricsResponse.json();
      setMetricsData(metricsResult);

      const historicalResponse = await fetch(`/api/ar-metrics/historical?months=${selectedTimeRange}`);
      if (!historicalResponse.ok) {
        throw new Error('Failed to fetch historical data');
      }
      const historicalResult = await historicalResponse.json();
      setHistoricalData(historicalResult.data);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTimeRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48 bg-slate-700" />
              <Skeleton className="h-4 w-32 mt-2 bg-slate-700" />
            </div>
            <Skeleton className="h-10 w-24 bg-slate-700" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} className="h-48 bg-slate-700" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert className="bg-red-500/20 border-red-500/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (!metricsData) {
    return (
      <DashboardLayout>
        <div className="text-center text-slate-400">No data available</div>
      </DashboardLayout>
    );
  }

  const currentWeekDate = new Date(metricsData.currentWeek).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate trend indicators
  const getTrendIndicators = () => {
    const trends = [];
    
    // Check for positive trends
    if (metricsData.metrics.collectedGmv.weekOverWeek.percentage && metricsData.metrics.collectedGmv.weekOverWeek.percentage > 5) {
      trends.push({ type: 'positive', metric: 'Collected GMV', change: metricsData.metrics.collectedGmv.weekOverWeek.percentage });
    }
    
    if (metricsData.metrics.cei.weekOverWeek.percentage && metricsData.metrics.cei.weekOverWeek.percentage > 2) {
      trends.push({ type: 'positive', metric: 'CEI', change: metricsData.metrics.cei.weekOverWeek.percentage });
    }
    
    // Check for negative trends
    if (metricsData.metrics.overdueGmv.weekOverWeek.percentage && metricsData.metrics.overdueGmv.weekOverWeek.percentage > 10) {
      trends.push({ type: 'negative', metric: 'Overdue GMV', change: metricsData.metrics.overdueGmv.weekOverWeek.percentage });
    }
    
    if (metricsData.metrics.dso.weekOverWeek.percentage && metricsData.metrics.dso.weekOverWeek.percentage > 5) {
      trends.push({ type: 'negative', metric: 'DSO', change: metricsData.metrics.dso.weekOverWeek.percentage });
    }
    
    return trends;
  };

  const trendIndicators = getTrendIndicators();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Advanced Analytics</h1>
            <p className="text-slate-400 mt-1">
              Week ending {currentWeekDate} • Comprehensive AR analytics & insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="text-sm text-slate-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <Button onClick={fetchData} variant="outline" size="sm" className="border-slate-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Analysis Time Range</h3>
              <div className="flex gap-2">
                {[
                  { value: '3', label: '3 Months' },
                  { value: '6', label: '6 Months' },
                  { value: '12', label: '12 Months' },
                  { value: '24', label: '24 Months' }
                ].map((range) => (
                  <Button
                    key={range.value}
                    onClick={() => setSelectedTimeRange(range.value)}
                    variant={selectedTimeRange === range.value ? 'default' : 'outline'}
                    size="sm"
                    className={selectedTimeRange === range.value ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600'}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trend Indicators */}
        {trendIndicators.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Key Trend Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trendIndicators.map((trend, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg flex items-center gap-2 ${
                      trend.type === 'positive' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}
                  >
                    {trend.type === 'positive' ? (
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`text-sm ${trend.type === 'positive' ? 'text-green-200' : 'text-red-200'}`}>
                      {trend.metric} {trend.type === 'positive' ? 'improved' : 'worsened'} by {Math.abs(trend.change).toFixed(1)}% WoW
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
            <TabsTrigger value="collections" className="data-[state=active]:bg-blue-600">Collections</TabsTrigger>
            <TabsTrigger value="aging" className="data-[state=active]:bg-blue-600">Aging</TabsTrigger>
            <TabsTrigger value="efficiency" className="data-[state=active]:bg-blue-600">Efficiency</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* All Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard
                title="Overdue GMV"
                value={metricsData.metrics.overdueGmv.current}
                change={metricsData.metrics.overdueGmv.weekOverWeek}
                format="currency"
                icon={AlertCircle}
                trailingAverages={metricsData.metrics.overdueGmv.trailingAverages}
              />
              
              <MetricCard
                title="Collected GMV"
                value={metricsData.metrics.collectedGmv.current}
                change={metricsData.metrics.collectedGmv.weekOverWeek}
                format="currency"
                icon={TrendingUp}
                trailingAverages={metricsData.metrics.collectedGmv.trailingAverages}
              />
              
              <MetricCard
                title="DSO (Days)"
                value={metricsData.metrics.dso.current}
                change={metricsData.metrics.dso.weekOverWeek}
                format="decimal"
                icon={Activity}
                trailingAverages={metricsData.metrics.dso.trailingAverages}
              />
            </div>

            {/* Overview Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LineChartComponent
                data={historicalData}
                dataKey="overdueGmv"
                title={`Overdue GMV Trend (${selectedTimeRange} Months)`}
                color="#FF6363"
                yAxisLabel="Amount ($)"
                formatValue={formatCurrency}
              />
              
              <LineChartComponent
                data={historicalData}
                dataKey="collectedGmv"
                title={`Collected GMV Trend (${selectedTimeRange} Months)`}
                color="#60B5FF"
                yAxisLabel="Amount ($)"
                formatValue={formatCurrency}
              />
            </div>
          </TabsContent>

          <TabsContent value="collections" className="space-y-6">
            {/* Collections Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard
                title="Collected GMV"
                value={metricsData.metrics.collectedGmv.current}
                change={metricsData.metrics.collectedGmv.weekOverWeek}
                format="currency"
                icon={TrendingUp}
                trailingAverages={metricsData.metrics.collectedGmv.trailingAverages}
              />
              
              <MetricCard
                title="Collected Invoices"
                value={metricsData.metrics.collectedInvoices.current}
                change={metricsData.metrics.collectedInvoices.weekOverWeek}
                format="number"
                icon={PieChart}
                trailingAverages={metricsData.metrics.collectedInvoices.trailingAverages}
              />
              
              <MetricCard
                title="Collection Effectiveness"
                value={metricsData.metrics.cei.current}
                change={metricsData.metrics.cei.weekOverWeek}
                format="percentage"
                icon={Target}
                trailingAverages={metricsData.metrics.cei.trailingAverages}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LineChartComponent
                data={historicalData}
                dataKey="collectedGmv"
                title={`Collected GMV Trend (${selectedTimeRange} Months)`}
                color="#60B5FF"
                yAxisLabel="Amount ($)"
                formatValue={formatCurrency}
              />
              
              <LineChartComponent
                data={historicalData}
                dataKey="cei"
                title={`Collection Effectiveness Trend (${selectedTimeRange} Months)`}
                color="#80D8C3"
                yAxisLabel="Percentage (%)"
                formatValue={(value) => `${value.toFixed(1)}%`}
              />
            </div>
          </TabsContent>

          <TabsContent value="aging" className="space-y-6">
            {/* Aging Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Overdue GMV"
                value={metricsData.metrics.overdueGmv.current}
                change={metricsData.metrics.overdueGmv.weekOverWeek}
                format="currency"
                icon={AlertCircle}
                trailingAverages={metricsData.metrics.overdueGmv.trailingAverages}
              />
              
              <MetricCard
                title="Avg Days Overdue"
                value={metricsData.metrics.weightedAvgDaysOverdue.current}
                change={metricsData.metrics.weightedAvgDaysOverdue.weekOverWeek}
                format="decimal"
                icon={Activity}
                trailingAverages={metricsData.metrics.weightedAvgDaysOverdue.trailingAverages}
              />
              
              <MetricCard
                title="Avg Days Late"
                value={metricsData.metrics.weightedAvgDaysLate.current}
                change={metricsData.metrics.weightedAvgDaysLate.weekOverWeek}
                format="decimal"
                icon={LineChart}
                trailingAverages={metricsData.metrics.weightedAvgDaysLate.trailingAverages}
              />
              
              <MetricCard
                title="DSO (Days)"
                value={metricsData.metrics.dso.current}
                change={metricsData.metrics.dso.weekOverWeek}
                format="decimal"
                icon={BarChart3}
                trailingAverages={metricsData.metrics.dso.trailingAverages}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LineChartComponent
                data={historicalData}
                dataKey="weightedAvgDaysOverdue"
                title={`Avg Days Overdue Trend (${selectedTimeRange} Months)`}
                color="#FF9149"
                yAxisLabel="Days"
                formatValue={(value) => `${value.toFixed(1)} days`}
              />
              
              <LineChartComponent
                data={historicalData}
                dataKey="dso"
                title={`DSO Trend (${selectedTimeRange} Months)`}
                color="#A19AD3"
                yAxisLabel="Days"
                formatValue={(value) => `${value.toFixed(1)} days`}
              />
            </div>
          </TabsContent>

          <TabsContent value="efficiency" className="space-y-6">
            {/* Efficiency Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard
                title="Collection Effectiveness"
                value={metricsData.metrics.cei.current}
                change={metricsData.metrics.cei.weekOverWeek}
                format="percentage"
                icon={Target}
                trailingAverages={metricsData.metrics.cei.trailingAverages}
              />
              
              <MetricCard
                title="AR Turnover Ratio"
                value={metricsData.metrics.arTurnoverRatio.current}
                change={metricsData.metrics.arTurnoverRatio.weekOverWeek}
                format="decimal"
                icon={Zap}
                trailingAverages={metricsData.metrics.arTurnoverRatio.trailingAverages}
              />
              
              <MetricCard
                title="% Credit Sales"
                value={metricsData.metrics.creditSalesPercent.current}
                change={metricsData.metrics.creditSalesPercent.weekOverWeek}
                format="percentage"
                icon={BarChart3}
                trailingAverages={metricsData.metrics.creditSalesPercent.trailingAverages}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LineChartComponent
                data={historicalData}
                dataKey="arTurnoverRatio"
                title={`AR Turnover Ratio Trend (${selectedTimeRange} Months)`}
                color="#FF9149"
                yAxisLabel="Ratio"
                formatValue={(value) => `${value.toFixed(2)}x`}
              />
              
              <LineChartComponent
                data={historicalData}
                dataKey="creditSalesPercent"
                title={`Credit Sales % Trend (${selectedTimeRange} Months)`}
                color="#72BF78"
                yAxisLabel="Percentage (%)"
                formatValue={(value) => `${value.toFixed(1)}%`}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
