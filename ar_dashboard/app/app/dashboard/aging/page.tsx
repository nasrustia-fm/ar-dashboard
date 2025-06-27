
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
  Clock,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Calendar,
  Timer
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
    weightedAvgDaysOverdue: MetricData;
    weightedAvgDaysLate: MetricData;
    dso: MetricData;
  };
  dataPoints: number;
}

interface HistoricalData {
  week: string;
  overdueGmv: number | null;
  weightedAvgDaysOverdue: number | null;
  weightedAvgDaysLate: number | null;
  dso: number | null;
}

export default function AgingPage() {
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

  // Calculate aging health score based on metrics
  const getAgingHealthScore = () => {
    const overdueGmv = metricsData.metrics.overdueGmv.current || 0;
    const avgDaysOverdue = metricsData.metrics.weightedAvgDaysOverdue.current || 0;
    const dso = metricsData.metrics.dso.current || 0;
    
    // Simple scoring logic (higher is worse for aging)
    let score = 100;
    if (overdueGmv > 1000000) score -= 20;
    if (avgDaysOverdue > 30) score -= 25;
    if (dso > 45) score -= 25;
    
    return Math.max(0, score);
  };

  const healthScore = getAgingHealthScore();
  const healthColor = healthScore >= 80 ? 'text-green-400' : healthScore >= 60 ? 'text-yellow-400' : 'text-red-400';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Aging Analysis</h1>
            <p className="text-slate-400 mt-1">
              Week ending {currentWeekDate} • Receivables aging & overdue analysis
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

        {/* Aging Health Score */}
        <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Aging Health Score</h3>
                <div className={`text-4xl font-bold ${healthColor}`}>
                  {healthScore}/100
                </div>
                <p className="text-slate-400 mt-1">
                  {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs Attention'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Based on</div>
                <div className="text-sm text-slate-300">Overdue GMV, Avg Days Overdue, DSO</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aging Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Overdue GMV"
            value={metricsData.metrics.overdueGmv.current}
            change={metricsData.metrics.overdueGmv.weekOverWeek}
            format="currency"
            icon={DollarSign}
            trailingAverages={metricsData.metrics.overdueGmv.trailingAverages}
          />
          
          <MetricCard
            title="Avg Days Overdue"
            value={metricsData.metrics.weightedAvgDaysOverdue.current}
            change={metricsData.metrics.weightedAvgDaysOverdue.weekOverWeek}
            format="decimal"
            icon={Clock}
            trailingAverages={metricsData.metrics.weightedAvgDaysOverdue.trailingAverages}
          />
          
          <MetricCard
            title="Avg Days Late"
            value={metricsData.metrics.weightedAvgDaysLate.current}
            change={metricsData.metrics.weightedAvgDaysLate.weekOverWeek}
            format="decimal"
            icon={Timer}
            trailingAverages={metricsData.metrics.weightedAvgDaysLate.trailingAverages}
          />
          
          <MetricCard
            title="DSO (Days)"
            value={metricsData.metrics.dso.current}
            change={metricsData.metrics.dso.weekOverWeek}
            format="decimal"
            icon={Calendar}
            trailingAverages={metricsData.metrics.dso.trailingAverages}
          />
        </div>

        {/* Aging Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChartComponent
            data={historicalData}
            dataKey="overdueGmv"
            title="Overdue GMV Trend (12 Months)"
            color="#FF6363"
            yAxisLabel="Amount ($)"
            formatValue={formatCurrency}
          />
          
          <LineChartComponent
            data={historicalData}
            dataKey="weightedAvgDaysOverdue"
            title="Avg Days Overdue Trend (12 Months)"
            color="#FF9149"
            yAxisLabel="Days"
            formatValue={(value) => `${value.toFixed(1)} days`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChartComponent
            data={historicalData}
            dataKey="weightedAvgDaysLate"
            title="Avg Days Late Trend (12 Months)"
            color="#FF90BB"
            yAxisLabel="Days"
            formatValue={(value) => `${value.toFixed(1)} days`}
          />
          
          <LineChartComponent
            data={historicalData}
            dataKey="dso"
            title="DSO Trend (12 Months)"
            color="#A19AD3"
            yAxisLabel="Days"
            formatValue={(value) => `${value.toFixed(1)} days`}
          />
        </div>

        {/* Aging Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                Aging Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metricsData.metrics.overdueGmv.current && metricsData.metrics.overdueGmv.current > 1000000 && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-200">High overdue GMV detected</span>
                  </div>
                )}
                {metricsData.metrics.weightedAvgDaysOverdue.current && metricsData.metrics.weightedAvgDaysOverdue.current > 30 && (
                  <div className="flex items-center gap-2 p-3 bg-orange-500/20 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-orange-200">Average days overdue exceeds 30 days</span>
                  </div>
                )}
                {metricsData.metrics.dso.current && metricsData.metrics.dso.current > 45 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/20 rounded-lg">
                    <Calendar className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-yellow-200">DSO above industry average</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-blue-400" />
                Aging Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Overdue</span>
                  <span className="text-white font-semibold">
                    {metricsData.metrics.overdueGmv.current ? formatCurrency(metricsData.metrics.overdueGmv.current) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Avg Days Overdue</span>
                  <span className="text-white font-semibold">
                    {metricsData.metrics.weightedAvgDaysOverdue.current ? `${metricsData.metrics.weightedAvgDaysOverdue.current.toFixed(1)} days` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">DSO</span>
                  <span className="text-white font-semibold">
                    {metricsData.metrics.dso.current ? `${metricsData.metrics.dso.current.toFixed(1)} days` : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
