import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Loader2, TrendingUp, Users, Eye, History, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';

export default function AdminAnalytics() {
  const [selectedUser, setSelectedUser] = useState(null);
  
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      // Fetch recent events
      const events = await base44.entities.AnalyticsEvent.list('-created_date', 1000);
      return events;
    },
    refetchInterval: 15000 // Refresh faster for "Live" feel
  });

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  // Aggregate Data
  const pageViews = {};
  const userActivity = {};
  let totalViews = 0;
  
  // Live Visitors (last 10 minutes)
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const liveVisitors = {};

  analytics?.forEach(event => {
    if (event.event_type === 'page_view') {
      const path = (event.path || '').split('?')[0];
      pageViews[path] = (pageViews[path] || 0) + 1;
      
      if (event.user_email) {
        userActivity[event.user_email] = (userActivity[event.user_email] || 0) + 1;
        
        // Check if live
        const eventTime = new Date(event.created_date); 
        if (eventTime > tenMinutesAgo) {
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
          <CardDescription>Users active in the last 10 minutes</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(liveVisitors).length === 0 ? (
            <p className="text-sm text-gray-500">No active users detected right now.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(liveVisitors).map(([email, data]) => (
                <div 
                  key={email} 
                  onClick={() => setSelectedUser(email)}
                  className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-purple-300 transition-colors"
                >
                  <div className="truncate pr-2">
                    <p className="font-medium text-sm truncate text-purple-900" title={email}>{email}</p>
                    <p className="text-xs text-purple-600 truncate flex items-center gap-1" title={data.path}>
                      <Eye className="w-3 h-3" /> {data.path}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(data.time), { addSuffix: true })}
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
              <p className="text-xs text-gray-400">In recent sample</p>
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
            <CardDescription>Most visited pages (Global)</CardDescription>
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
            <CardDescription>Click a user to see their history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {topUsers.map((user, idx) => (
                <div 
                  key={user.email} 
                  onClick={() => setSelectedUser(user.email)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium hover:text-purple-600 hover:underline">{user.email}</p>
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

      <UserInspector userEmail={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  );
}

function UserInspector({ userEmail, onClose }) {
  const { data: userEvents, isLoading } = useQuery({
    queryKey: ['userEvents', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      // Fetch specifically for this user
      return await base44.entities.AnalyticsEvent.filter({ user_email: userEmail }, '-created_date', 100);
    },
    enabled: !!userEmail
  });

  if (!userEmail) return null;

  // Calculate stats for this user
  const userPageViews = {};
  userEvents?.forEach(e => {
    const path = (e.path || '').split('?')[0];
    userPageViews[path] = (userPageViews[path] || 0) + 1;
  });

  const topUserPages = Object.entries(userPageViews)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <Dialog open={!!userEmail} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>User History: {userEmail}</DialogTitle>
          <DialogDescription>Recent activity and top pages for this user</DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
        ) : (
          <div className="space-y-6 overflow-y-auto pr-2">
            
            {/* Top Pages for User */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Most Visited by {userEmail.split('@')[0]}
              </h4>
              <div className="space-y-2">
                {topUserPages.map((page, i) => (
                  <div key={page.name} className="flex justify-between items-center bg-white p-2 rounded border border-purple-100 text-sm">
                    <span className="font-medium text-gray-700">{i+1}. {page.name}</span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">{page.count} views</span>
                  </div>
                ))}
                {topUserPages.length === 0 && <p className="text-gray-500 text-sm">No page views recorded.</p>}
              </div>
            </div>

            {/* History Stream */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <History className="w-4 h-4" /> Activity Log (Last 100)
              </h4>
              <div className="space-y-0 relative border-l-2 border-gray-200 ml-2">
                {userEvents?.map((event, i) => (
                  <div key={event.id} className="mb-4 ml-4 relative">
                    <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-gray-300 rounded-full border-2 border-white"></div>
                    <div className="bg-white border rounded p-3 text-sm hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-gray-900 break-all">{event.path}</span>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatDistanceToNow(new Date(event.created_date), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(event.created_date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                {(!userEvents || userEvents.length === 0) && (
                  <div className="ml-4 text-gray-500 text-sm">No recent activity found.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}