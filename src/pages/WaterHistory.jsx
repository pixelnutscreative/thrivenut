import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Droplet, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { format, startOfWeek, startOfMonth, startOfYear, subDays, subWeeks, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';

export default function WaterHistory() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('today');

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  // Fetch all water logs
  const { data: allWaterLogs = [], isLoading } = useQuery({
    queryKey: ['allWaterLogs', effectiveEmail],
    queryFn: () => base44.entities.WaterLog.filter({ created_by: effectiveEmail }, '-date'),
    enabled: !!effectiveEmail,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const thisWeekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
    const thisMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const thisYearStart = format(startOfYear(new Date()), 'yyyy-MM-dd');

    const todayLog = allWaterLogs.find(log => log.date === today);
    const weekLogs = allWaterLogs.filter(log => log.date >= thisWeekStart);
    const monthLogs = allWaterLogs.filter(log => log.date >= thisMonthStart);
    const yearLogs = allWaterLogs.filter(log => log.date >= thisYearStart);

    return {
      today: todayLog?.glasses || 0,
      week: weekLogs.reduce((sum, log) => sum + (log.glasses || 0), 0),
      month: monthLogs.reduce((sum, log) => sum + (log.glasses || 0), 0),
      year: yearLogs.reduce((sum, log) => sum + (log.glasses || 0), 0),
      weekAvg: weekLogs.length > 0 ? (weekLogs.reduce((sum, log) => sum + (log.glasses || 0), 0) / weekLogs.length).toFixed(1) : 0,
      monthAvg: monthLogs.length > 0 ? (monthLogs.reduce((sum, log) => sum + (log.glasses || 0), 0) / monthLogs.length).toFixed(1) : 0,
    };
  }, [allWaterLogs]);

  // Chart data
  const chartData = useMemo(() => {
    if (activeTab === 'week') {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const log = allWaterLogs.find(l => l.date === dateStr);
        return {
          date: format(date, 'EEE'),
          glasses: log?.glasses || 0
        };
      });
      return last7Days;
    } else if (activeTab === 'month') {
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const log = allWaterLogs.find(l => l.date === dateStr);
        return {
          date: format(date, 'MMM d'),
          glasses: log?.glasses || 0
        };
      });
      return last30Days;
    }
    return [];
  }, [allWaterLogs, activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
            <Droplet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Water Tracking</h1>
            <p className="text-gray-600">Stay hydrated, stay healthy 💧</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-cyan-600">{stats.today}</p>
              <p className="text-sm text-gray-600">Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.week}</p>
              <p className="text-sm text-gray-600">This Week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.month}</p>
              <p className="text-sm text-gray-600">This Month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-indigo-600">{stats.year}</p>
              <p className="text-sm text-gray-600">This Year</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Last 7 Days</TabsTrigger>
            <TabsTrigger value="month">Last 30 Days</TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <Card>
              <CardHeader>
                <CardTitle>Today's Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.min((stats.today / 8) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {stats.today}/8 glasses (Goal: 8/day)
                    </p>
                  </div>
                  {stats.today >= 8 && (
                    <Badge className="bg-green-500">Goal Reached! 🎉</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="week">
            <Card>
              <CardHeader>
                <CardTitle>Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="glasses" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-600 text-center mt-4">
                  Weekly Average: {stats.weekAvg} glasses/day
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month">
            <Card>
              <CardHeader>
                <CardTitle>Last 30 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="glasses" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-600 text-center mt-4">
                  Monthly Average: {stats.monthAvg} glasses/day
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}