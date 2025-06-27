
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
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Activity
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
    dso: MetricData;
    arTurnoverRatio: MetricData;
    collectedGmv: MetricData;
    creditSalesPercent: MetricData;
  };
  dataPoints: number;
}

interface HistoricalData {
  week: string;
  dso: number | null;
  arTurnoverRatio: number | null;
  collectedGmv: number;
  creditSalesPercent: number | null;
}

export default function DSOPage() {
  const [metricsData, setMetricsData] = useState<ApiResponse | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

      const historicalResponse = await fetch('/api/ar-metrics/historical?months=12');
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
  }, []);

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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
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

  // Calculate DSO performance indicators
  const currentDSO = metricsData.metrics.dso.current || 0;
  const dsoTrend = metricsData.metrics.dso.weekOverWeek.percentage || 0;
  const industryBenchmark = 30; // Industry average DSO benchmark

  const getDSOStatus = () => {
    if (currentDSO <= 30) return { status: 'Excellent', color: 'text-green-400', bgColor: 'bg-green-500/20' };
    if (currentDSO <= 45) return { status: 'Good', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
    if (currentDSO <= 60) return { status: 'Fair', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
    return { status: 'Poor', color: 'text-red-400', bgColor: 'bg-red-500/20' };
  };

  const dsoStatus = getDSOStatus();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">DSO Analysis</h1>
            <p className="text-slate-400 mt-1">
              Week ending {currentWeekDate} • Days Sales Outstanding trends & analysis
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

        {/* DSO Status Card */}
        <Card className={`border-slate-700 ${dsoStatus.bgColor}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Current DSO Status</h3>
                <div className="flex items-center gap-4">
                  <div className={`text-4xl font-bold ${dsoStatus.color}`}>
                    {currentDSO.toFixed(1)} days
                  </div>
                  <div>
                    <Badge className={`${dsoStatus.bgColor} ${dsoStatus.color} border-none`}>
                      {dsoStatus.status}
                    </Badge>
                    <div className="text-sm text-slate-400 mt-1">
                      {dsoTrend >= 0 ? '↑' : '↓'} {Math.abs(dsoTrend).toFixed(1)}% WoW
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Industry Benchmark</div>
                <div className="text-2xl font-bold text-slate-300">{industryBenchmark} days</div>
                <div className="text-sm text-slate-400">
                  {currentDSO <= industryBenchmark ? 'Below benchmark' : 'Above benchmark'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DSO Related Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="DSO (Days)"
            value={metricsData.metrics.dso.current}
            change={metricsData.metrics.dso.weekOverWeek}
            format="decimal"
            icon={Calendar}
            trailingAverages={metricsData.metrics.dso.trailingAverages}
          />
          
          <MetricCard
            title="AR Turnover Ratio"
            value={metricsData.metrics.arTurnoverRatio.current}
            change={metricsData.metrics.arTurnoverRatio.weekOverWeek}
            format="decimal"
            icon={Activity}
            trailingAverages={metricsData.metrics.arTurnoverRatio.trailingAverages}
          />
          
          <MetricCard
            title="Collected GMV"
            value={metricsData.metrics.collectedGmv.current}
            change={metricsData.metrics.collectedGmv.weekOverWeek}
            format="currency"
            icon={Target}
            trailingAverages={metricsData.metrics.collectedGmv.trailingAverages}
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

        {/* DSO Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChartComponent
            data={historicalData}
            dataKey="dso"
            title="DSO Trend (12 Months)"
            color="#60B5FF"
            yAxisLabel="Days"
            formatValue={(value) => `${value.toFixed(1)} days`}
          />
          
          <LineChartComponent
            data={historicalData}
            dataKey="arTurnoverRatio"
            title="AR Turnover Ratio Trend (12 Months)"
            color="#FF9149"
            yAxisLabel="Ratio"
            formatValue={(value) => `${value.toFixed(2)}x`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChartComponent
            data={historicalData}
            dataKey="collectedGmv"
            title="Collected GMV Trend (12 Months)"
            color="#80D8C3"
            yAxisLabel="Amount ($)"
            formatValue={formatCurrency}
          />
          
          <LineChartComponent
            data={historicalData}
            dataKey="creditSalesPercent"
            title="Credit Sales % Trend (12 Months)"
            color="#A19AD3"
            yAxisLabel="Percentage (%)"
            formatValue={(value) => `${value.toFixed(1)}%`}
          />
        </div>

        {/* DSO Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                DSO Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <div className="text-sm font-medium text-white">Current Performance</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Your DSO is {currentDSO > industryBenchmark ? 'above' : 'below'} industry benchmark by{' '}
                    {Math.abs(currentDSO - industryBenchmark).toFixed(1)} days
                  </div>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <div className="text-sm font-medium text-white">Trend Analysis</div>
                  <div className="text-xs text-slate-400 mt-1">
                    DSO {dsoTrend >= 0 ? 'increased' : 'decreased'} by {Math.abs(dsoTrend).toFixed(1)}% week-over-week
                  </div>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <div className="text-sm font-medium text-white">Trailing Average</div>
                  <div className="text-xs text-slate-400 mt-1">
                    12-month average: {metricsData.metrics.dso.trailingAverages.twelveMonth?.toFixed(1) || 'N/A'} days
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-green-400" />
                Improvement Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentDSO > industryBenchmark && (
                  <div className="flex items-center gap-2 p-3 bg-orange-500/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-orange-200">Focus on reducing DSO to industry benchmark</span>
                  </div>
                )}
                {dsoTrend > 5 && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/20 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-200">DSO trending upward - review collection processes</span>
                  </div>
                )}
                {metricsData.metrics.arTurnoverRatio.current && metricsData.metrics.arTurnoverRatio.current < 6 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/20 rounded-lg">
                    <Activity className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-yellow-200">Low AR turnover - consider payment terms optimization</span>
                  </div>
                )}
                {currentDSO <= industryBenchmark && dsoTrend <= 0 && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/20 rounded-lg">
                    <Target className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-green-200">Excellent DSO performance - maintain current processes</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
