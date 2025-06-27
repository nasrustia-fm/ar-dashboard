
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
  Calendar,
  Clock,
  Target,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Upload,
  Database
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
  dso: number | null;
  cei: number | null;
  arTurnoverRatio: number | null;
}

interface UploadStatus {
  lastUpload: string | null;
  latestDataWeek: string | null;
  totalRecords: number;
  status: string;
}

export default function DashboardPage() {
  const [metricsData, setMetricsData] = useState<ApiResponse | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch upload status first to check if data exists
      const uploadResponse = await fetch('/api/upload-csv');
      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        setUploadStatus(uploadResult);
      }

      // Fetch current metrics
      const metricsResponse = await fetch('/api/ar-metrics');
      if (!metricsResponse.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const metricsResult = await metricsResponse.json();
      setMetricsData(metricsResult);

      // Fetch historical data
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">AR Metrics Overview</h1>
            <p className="text-slate-400 mt-1">
              Week ending {currentWeekDate} • {metricsData.dataPoints} data points
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

        {/* Upload Status Card */}
        {uploadStatus && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <Database className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Data Source Status</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                      <span>Records: {uploadStatus.totalRecords}</span>
                      {uploadStatus.latestDataWeek && (
                        <span>Latest Week: {new Date(uploadStatus.latestDataWeek).toLocaleDateString()}</span>
                      )}
                      {uploadStatus.lastUpload && (
                        <span>Uploaded: {new Date(uploadStatus.lastUpload).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={uploadStatus.status === 'ready' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {uploadStatus.status === 'ready' ? 'Data Ready' : 'No Data'}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-slate-600"
                    onClick={() => window.location.href = '/dashboard/upload'}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Overdue GMV"
            value={metricsData.metrics.overdueGmv.current}
            change={metricsData.metrics.overdueGmv.weekOverWeek}
            format="currency"
            icon={DollarSign}
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
            title="Collected Invoices"
            value={metricsData.metrics.collectedInvoices.current}
            change={metricsData.metrics.collectedInvoices.weekOverWeek}
            format="number"
            icon={FileText}
            trailingAverages={metricsData.metrics.collectedInvoices.trailingAverages}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="DSO (Days)"
            value={metricsData.metrics.dso.current}
            change={metricsData.metrics.dso.weekOverWeek}
            format="decimal"
            icon={Calendar}
            trailingAverages={metricsData.metrics.dso.trailingAverages}
          />
          
          <MetricCard
            title="Weighted Avg Days Overdue"
            value={metricsData.metrics.weightedAvgDaysOverdue.current}
            change={metricsData.metrics.weightedAvgDaysOverdue.weekOverWeek}
            format="decimal"
            icon={Clock}
            trailingAverages={metricsData.metrics.weightedAvgDaysOverdue.trailingAverages}
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

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="% Credit Sales"
            value={metricsData.metrics.creditSalesPercent.current}
            change={metricsData.metrics.creditSalesPercent.weekOverWeek}
            format="percentage"
            icon={TrendingUp}
            trailingAverages={metricsData.metrics.creditSalesPercent.trailingAverages}
          />
          
          <MetricCard
            title="CEI (Collection Effectiveness)"
            value={metricsData.metrics.cei.current}
            change={metricsData.metrics.cei.weekOverWeek}
            format="percentage"
            icon={Target}
            trailingAverages={metricsData.metrics.cei.trailingAverages}
          />
          
          <MetricCard
            title="Weighted Avg Days Late"
            value={metricsData.metrics.weightedAvgDaysLate.current}
            change={metricsData.metrics.weightedAvgDaysLate.weekOverWeek}
            format="decimal"
            icon={Clock}
            trailingAverages={metricsData.metrics.weightedAvgDaysLate.trailingAverages}
          />
        </div>

        {/* Charts */}
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
            dataKey="collectedGmv"
            title="Collected GMV Trend (12 Months)"
            color="#60B5FF"
            yAxisLabel="Amount ($)"
            formatValue={formatCurrency}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChartComponent
            data={historicalData}
            dataKey="dso"
            title="DSO Trend (12 Months)"
            color="#FF9149"
            yAxisLabel="Days"
            formatValue={(value) => `${value.toFixed(1)} days`}
          />
          
          <LineChartComponent
            data={historicalData}
            dataKey="cei"
            title="CEI Trend (12 Months)"
            color="#80D8C3"
            yAxisLabel="Percentage (%)"
            formatValue={(value) => `${value.toFixed(1)}%`}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
