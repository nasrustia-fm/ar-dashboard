
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
  DollarSign,
  FileText,
  TrendingUp,
  Target,
  RefreshCw,
  AlertCircle,
  Trophy,
  BarChart3
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
    collectedGmv: MetricData;
    collectedInvoices: MetricData;
    cei: MetricData;
    creditSalesPercent: MetricData;
    arTurnoverRatio: MetricData;
  };
  dataPoints: number;
}

interface HistoricalData {
  week: string;
  collectedGmv: number;
  collectedInvoices: number;
  cei: number | null;
  creditSalesPercent: number | null;
  arTurnoverRatio: number | null;
}

export default function CollectionsPage() {
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(5)].map((_, i) => (
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Collections Performance</h1>
            <p className="text-slate-400 mt-1">
              Week ending {currentWeekDate} • Collection metrics & trends
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

        {/* Collection Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Collected GMV"
            value={metricsData.metrics.collectedGmv.current}
            change={metricsData.metrics.collectedGmv.weekOverWeek}
            format="currency"
            icon={DollarSign}
            trailingAverages={metricsData.metrics.collectedGmv.trailingAverages}
          />
          
          <MetricCard
            title="Collected Invoices"
            value={metricsData.metrics.collectedInvoices.current}
            change={metricsData.metrics.collectedInvoices.weekOverWeek}
            format="number"
            icon={FileText}
            trailingAverages={metricsData.metrics.collectedInvoices.trailingAverages}
          />
          
          <MetricCard
            title="Collection Effectiveness (CEI)"
            value={metricsData.metrics.cei.current}
            change={metricsData.metrics.cei.weekOverWeek}
            format="percentage"
            icon={Trophy}
            trailingAverages={metricsData.metrics.cei.trailingAverages}
          />
        </div>

        {/* Additional Collection Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricCard
            title="% Credit Sales"
            value={metricsData.metrics.creditSalesPercent.current}
            change={metricsData.metrics.creditSalesPercent.weekOverWeek}
            format="percentage"
            icon={BarChart3}
            trailingAverages={metricsData.metrics.creditSalesPercent.trailingAverages}
          />
          
          <MetricCard
            title="AR Turnover Ratio"
            value={metricsData.metrics.arTurnoverRatio.current}
            change={metricsData.metrics.arTurnoverRatio.weekOverWeek}
            format="decimal"
            icon={Target}
            trailingAverages={metricsData.metrics.arTurnoverRatio.trailingAverages}
          />
        </div>

        {/* Collection Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChartComponent
            data={historicalData}
            dataKey="collectedGmv"
            title="Collected GMV Trend (12 Months)"
            color="#60B5FF"
            yAxisLabel="Amount ($)"
            formatValue={formatCurrency}
          />
          
          <LineChartComponent
            data={historicalData}
            dataKey="collectedInvoices"
            title="Collected Invoices Trend (12 Months)"
            color="#FF9149"
            yAxisLabel="Count"
            formatValue={(value) => `${value.toLocaleString()} invoices`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChartComponent
            data={historicalData}
            dataKey="cei"
            title="Collection Effectiveness Trend (12 Months)"
            color="#80D8C3"
            yAxisLabel="Percentage (%)"
            formatValue={(value) => `${value.toFixed(1)}%`}
          />
          
          <LineChartComponent
            data={historicalData}
            dataKey="arTurnoverRatio"
            title="AR Turnover Ratio Trend (12 Months)"
            color="#A19AD3"
            yAxisLabel="Ratio"
            formatValue={(value) => `${value.toFixed(2)}x`}
          />
        </div>

        {/* Performance Summary */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-400" />
              Collection Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {metricsData.metrics.collectedGmv.current ? formatCurrency(metricsData.metrics.collectedGmv.current) : 'N/A'}
                </div>
                <div className="text-sm text-slate-400">Total Collections This Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {metricsData.metrics.cei.current ? `${metricsData.metrics.cei.current.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-slate-400">Collection Effectiveness</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {metricsData.metrics.arTurnoverRatio.current ? `${metricsData.metrics.arTurnoverRatio.current.toFixed(2)}x` : 'N/A'}
                </div>
                <div className="text-sm text-slate-400">AR Turnover Ratio</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
