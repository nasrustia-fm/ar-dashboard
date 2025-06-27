
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
  Target,
  Activity,
  TrendingUp,
  Calendar,
  Trophy,
  RefreshCw,
  AlertCircle,
  Zap,
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
    cei: MetricData;
    arTurnoverRatio: MetricData;
    dso: MetricData;
    collectedGmv: MetricData;
    collectedInvoices: MetricData;
    creditSalesPercent: MetricData;
  };
  dataPoints: number;
}

interface HistoricalData {
  week: string;
  cei: number | null;
  arTurnoverRatio: number | null;
  dso: number | null;
  collectedGmv: number;
  collectedInvoices: number;
  creditSalesPercent: number | null;
}

export default function EfficiencyPage() {
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
            {[...Array(6)].map((_, i) => (
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

  // Calculate efficiency score
  const getEfficiencyScore = () => {
    const cei = metricsData.metrics.cei.current || 0;
    const arTurnover = metricsData.metrics.arTurnoverRatio.current || 0;
    const dso = metricsData.metrics.dso.current || 45;
    
    // Weighted efficiency score calculation
    let score = 0;
    
    // CEI weight: 40% (higher is better)
    score += (cei / 100) * 40;
    
    // AR Turnover weight: 30% (higher is better, normalized to 0-1 scale)
    score += Math.min(arTurnover / 12, 1) * 30;
    
    // DSO weight: 30% (lower is better, inverted)
    score += Math.max(0, (60 - dso) / 60) * 30;
    
    return Math.min(100, Math.max(0, score));
  };

  const efficiencyScore = getEfficiencyScore();
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">AR Efficiency Metrics</h1>
            <p className="text-slate-400 mt-1">
              Week ending {currentWeekDate} • Collection efficiency & performance analysis
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

        {/* Efficiency Score */}
        <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-400" />
                  Overall Efficiency Score
                </h3>
                <div className={`text-5xl font-bold ${getScoreColor(efficiencyScore)}`}>
                  {efficiencyScore.toFixed(0)}/100
                </div>
                <Badge className={`mt-2 ${getScoreColor(efficiencyScore)} border-none`}>
                  {getScoreStatus(efficiencyScore)}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400 mb-2">Efficiency Components</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">CEI (40%)</span>
                    <span className="text-white">{metricsData.metrics.cei.current?.toFixed(1) || 'N/A'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">AR Turnover (30%)</span>
                    <span className="text-white">{metricsData.metrics.arTurnoverRatio.current?.toFixed(2) || 'N/A'}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">DSO (30%)</span>
                    <span className="text-white">{metricsData.metrics.dso.current?.toFixed(1) || 'N/A'} days</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core Efficiency Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Collection Effectiveness (CEI)"
            value={metricsData.metrics.cei.current}
            change={metricsData.metrics.cei.weekOverWeek}
            format="percentage"
            icon={Trophy}
            trailingAverages={metricsData.metrics.cei.trailingAverages}
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
            title="DSO (Days)"
            value={metricsData.metrics.dso.current}
            change={metricsData.metrics.dso.weekOverWeek}
            format="decimal"
            icon={Calendar}
            trailingAverages={metricsData.metrics.dso.trailingAverages}
          />
        </div>

        {/* Supporting Metrics */}
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
            icon={Target}
            trailingAverages={metricsData.metrics.collectedInvoices.trailingAverages}
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

        {/* Efficiency Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChartComponent
            data={historicalData}
            dataKey="cei"
            title="Collection Effectiveness Trend (12 Months)"
            color="#60B5FF"
            yAxisLabel="Percentage (%)"
            formatValue={(value) => `${value.toFixed(1)}%`}
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
            dataKey="dso"
            title="DSO Trend (12 Months)"
            color="#FF6363"
            yAxisLabel="Days"
            formatValue={(value) => `${value.toFixed(1)} days`}
          />
          
          <LineChartComponent
            data={historicalData}
            dataKey="collectedGmv"
            title="Collected GMV Trend (12 Months)"
            color="#80D8C3"
            yAxisLabel="Amount ($)"
            formatValue={formatCurrency}
          />
        </div>

        {/* Efficiency Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Efficiency Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metricsData.metrics.cei.current && metricsData.metrics.cei.current >= 80 && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/20 rounded-lg">
                    <Trophy className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-green-200">Excellent collection effectiveness</span>
                  </div>
                )}
                {metricsData.metrics.arTurnoverRatio.current && metricsData.metrics.arTurnoverRatio.current >= 8 && (
                  <div className="flex items-center gap-2 p-3 bg-blue-500/20 rounded-lg">
                    <Activity className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-blue-200">Strong AR turnover performance</span>
                  </div>
                )}
                {metricsData.metrics.dso.current && metricsData.metrics.dso.current <= 30 && (
                  <div className="flex items-center gap-2 p-3 bg-purple-500/20 rounded-lg">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-purple-200">Optimal DSO performance</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-400" />
                Improvement Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metricsData.metrics.cei.current && metricsData.metrics.cei.current < 70 && (
                  <div className="flex items-center gap-2 p-3 bg-orange-500/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-orange-200">Focus on improving collection processes</span>
                  </div>
                )}
                {metricsData.metrics.arTurnoverRatio.current && metricsData.metrics.arTurnoverRatio.current < 6 && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/20 rounded-lg">
                    <Activity className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-200">Low AR turnover - review credit policies</span>
                  </div>
                )}
                {metricsData.metrics.dso.current && metricsData.metrics.dso.current > 45 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/20 rounded-lg">
                    <Calendar className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-yellow-200">High DSO - accelerate collection efforts</span>
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
