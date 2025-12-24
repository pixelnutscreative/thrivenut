import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Loader2, TrendingUp, Users, Eye } from 'lucide-react';

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState(7); // days

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['adminAnalytics', timeRange],
    queryFn: async () => {
      // Fetch events (limit to recent for performance, or fetch reasonable amount)
      const events = await base44.entities.AnalyticsEvent.list('-created_date', 1000);
      return events;
    },
    refetchInterval: 30000 // Refresh every 30s for somewhat live data
  });

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  // Aggregate Data
  const pageViews = {};
  const userActivity = {};
  let totalViews = 0;
  
  // Live Visitors (last 5 minutes)
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const liveVisitors = {};

  analytics?.forEach(event => {
    if (event.event_type === 'page_view') {
      const path = event.path.split('?')[0]; // Simple path
      pageViews[path] = (pageViews[path] || 0) + 1;
      
      if (event.user_email) {
        userActivity[event.user_email] = (userActivity[event.user_email] || 0) + 1;
        
        // Check if live
        const eventTime = new Date(event.created_date); // created_date is auto-added
        if (eventTime > fiveMinutesAgo) {
          if (!liveVisitors[event.user_email] || new Date(liveVisitors[event.user_email].time) < eventTime) {
            liveVisitors[event.user_email] = {
              path: path,
              time: event.created_date
            };
          }
        }
      }
      totalViews++;
    }
  });

  // Prepare Chart Data (Top 10 Pages)
  const chartData = Object.entries(pageViews)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top Users
  const topUsers = Object.entries(userActivity)
    .map(([email, count]) => ({ email, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Live Visitors Section */}
      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Live Right Now
          </CardTitle>
          <CardDescription>Users active in the last 5 minutes</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(liveVisitors).length === 0 ? (
            <p className="text-sm text-gray-500">No active users right now.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(liveVisitors).map(([email, data]) => (
                <div key={email} className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm flex items-center justify-between">
                  <div className="truncate pr-2">
                    <p className="font-medium text-sm truncate" title={email}>{email}</p>
                    <p className="text-xs text-purple-600 truncate" title={data.path}>on {data.path}</p>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    Just now
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Page Views</p>
              <h3 className="text-2xl font-bold">{totalViews}</h3>
              <p className="text-xs text-gray-400">Last 1000 events</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <h3 className="text-2xl font-bold">{Object.keys(userActivity).length}</h3>
              <p className="text-xs text-gray-400">Unique visitors</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Most Popular</p>
              <h3 className="text-lg font-bold truncate max-w-[150px]" title={chartData[0]?.name}>
                {chartData[0]?.name || 'N/A'}
              </h3>
              <p className="text-xs text-gray-400">Top visited page</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Users</CardTitle>
            <CardDescription>Most active members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topUsers.map((user, idx) => (
                <div key={user.email} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-700">
                    {user.count} views
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}