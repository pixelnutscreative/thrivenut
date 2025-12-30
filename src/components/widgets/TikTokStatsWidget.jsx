import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, RefreshCw, Plus, Save, BarChart2, Users, Heart } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTheme } from '../shared/useTheme';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format } from 'date-fns';

export default function TikTokStatsWidget() {
  const { isDark, primaryColor, accentColor, textClass, subtextClass, cardBgClass } = useTheme();
  const [username, setUsername] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualStats, setManualStats] = useState({ followers: '', likes: '', following: '' });
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // Load username from preferences
  const { data: preferences } = useQuery({
    queryKey: ['myPreferences'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return null;
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    }
  });

  useEffect(() => {
    if (preferences?.tiktok_username) {
      setUsername(preferences.tiktok_username);
    }
  }, [preferences]);

  // Load Stats History
  const { data: statsHistory = [] } = useQuery({
    queryKey: ['tiktokStatsHistory'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      // We use AnalyticsEvent to store historical stats logs
      const logs = await base44.entities.AnalyticsEvent.filter({ 
        user_email: user.email,
        event_type: 'tiktok_stats_log'
      }, '-created_date', 30); // Last 30 entries
      
      return logs.reverse().map(log => ({
        date: format(new Date(log.created_date), 'MMM d'),
        fullDate: log.created_date,
        ...log.metadata
      }));
    }
  });

  const saveStatsMutation = useMutation({
    mutationFn: async (stats) => {
      const user = await base44.auth.me();
      
      // Save to AnalyticsEvent for history
      await base44.entities.AnalyticsEvent.create({
        user_email: user.email,
        event_type: 'tiktok_stats_log',
        path: 'TikTokEngagement',
        metadata: {
          followers: parseCount(stats.followers),
          likes: parseCount(stats.likes),
          following: parseCount(stats.following),
          source: stats.source || 'manual'
        }
      });

      // Update username in preferences if changed
      if (preferences && preferences.tiktok_username !== username) {
        await base44.entities.UserPreferences.update(preferences.id, { tiktok_username: username });
      } else if (!preferences) {
        // Create prefs if missing (unlikely)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokStatsHistory'] });
      setIsManualInput(false);
    }
  });

  const handleSync = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const response = await base44.functions.invoke('fetchPublicTikTokStats', { username });
      
      if (response.data?.error === 'scrape_failed') {
        // Fallback to manual
        setIsManualInput(true);
      } else if (response.data?.followers) {
        // Success
        saveStatsMutation.mutate({
          followers: response.data.followers,
          likes: response.data.likes,
          following: response.data.following,
          source: 'auto_sync'
        });
      }
    } catch (err) {
      console.error(err);
      setIsManualInput(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    saveStatsMutation.mutate({
      followers: manualStats.followers,
      likes: manualStats.likes,
      following: manualStats.following,
      source: 'manual'
    });
  };

  const parseCount = (str) => {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    const s = str.toString().toUpperCase().replace(/,/g, '');
    if (s.includes('K')) return parseFloat(s) * 1000;
    if (s.includes('M')) return parseFloat(s) * 1000000;
    return parseFloat(s) || 0;
  };

  const latestStats = statsHistory[statsHistory.length - 1] || null;

  return (
    <Card className={`${cardBgClass} overflow-hidden border-l-4`} style={{ borderLeftColor: primaryColor }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-black text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">My Growth Tracker</CardTitle>
              <p className={`text-xs ${subtextClass}`}>
                {latestStats ? `Last updated: ${format(new Date(latestStats.fullDate), 'MMM d, h:mm a')}` : 'Track your TikTok growth'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isManualInput && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSync} 
                disabled={loading || !username}
                className="h-8"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Sync
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsManualInput(!isManualInput)}
              className="h-8"
            >
              {isManualInput ? 'Cancel' : (
                <>
                  <Plus className="w-4 h-4 mr-2" /> Log Manually
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {!username && !isManualInput && (
          <div className="flex gap-2 mb-4">
            <Input 
              placeholder="Enter your TikTok username (@...)" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="bg-white/50"
            />
            <Button onClick={handleSync} disabled={!username}>Start Tracking</Button>
          </div>
        )}

        {isManualInput ? (
          <form onSubmit={handleManualSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Followers</Label>
                <Input 
                  placeholder="e.g. 10.5K" 
                  value={manualStats.followers}
                  onChange={(e) => setManualStats({...manualStats, followers: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Likes</Label>
                <Input 
                  placeholder="e.g. 50K" 
                  value={manualStats.likes}
                  onChange={(e) => setManualStats({...manualStats, likes: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Following</Label>
                <Input 
                  placeholder="e.g. 200" 
                  value={manualStats.following}
                  onChange={(e) => setManualStats({...manualStats, following: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saveStatsMutation.isPending} className="bg-gradient-to-r from-purple-500 to-pink-500">
                <Save className="w-4 h-4 mr-2" /> Save Log
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 text-center">
                <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
                  <Users className="w-3 h-3" /> Followers
                </div>
                <div className="text-xl font-bold">{latestStats?.followers?.toLocaleString() || '-'}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 text-center">
                <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
                  <Heart className="w-3 h-3" /> Likes
                </div>
                <div className="text-xl font-bold">{latestStats?.likes?.toLocaleString() || '-'}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 text-center">
                <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
                  <Users className="w-3 h-3" /> Following
                </div>
                <div className="text-xl font-bold">{latestStats?.following?.toLocaleString() || '-'}</div>
              </div>
            </div>

            {/* Chart */}
            {statsHistory.length > 1 && (
              <div className="h-48 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statsHistory}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis 
                      dataKey="date" 
                      stroke={isDark ? "#888" : "#ccc"} 
                      fontSize={12} 
                      tickLine={false}
                    />
                    <YAxis 
                      stroke={isDark ? "#888" : "#ccc"} 
                      fontSize={12} 
                      tickLine={false}
                      width={40}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                        return value;
                      }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="followers" 
                      stroke={primaryColor} 
                      strokeWidth={2} 
                      dot={{ r: 3 }} 
                      name="Followers"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="likes" 
                      stroke={accentColor} 
                      strokeWidth={2} 
                      dot={false} 
                      name="Likes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}