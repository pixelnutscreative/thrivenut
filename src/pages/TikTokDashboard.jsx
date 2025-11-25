import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Swords, Video, FileText, Users, Calendar, TrendingUp, 
  CheckCircle2, Clock, ArrowRight, MessageCircle, Share2
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, isToday, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

export default function TikTokDashboard() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const todayDayName = format(new Date(), 'EEEE');

  const { data: contentGoal } = useQuery({
    queryKey: ['contentGoal', weekStart],
    queryFn: async () => {
      const goals = await base44.entities.ContentGoal.filter({ 
        week_starting: weekStart,
        created_by: user.email 
      });
      return goals[0] || null;
    },
    enabled: !!user,
  });

  const { data: liveSchedules = [] } = useQuery({
    queryKey: ['liveSchedules', user?.email],
    queryFn: () => base44.entities.LiveSchedule.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts', user?.email],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user,
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ scheduleType, index, field, value }) => {
      const currentSchedules = [...contentGoal[scheduleType]];
      currentSchedules[index] = { ...currentSchedules[index], [field]: value };
      return await base44.entities.ContentGoal.update(contentGoal.id, { [scheduleType]: currentSchedules });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentGoal'] });
    }
  });

  // Calculate today's and week's stats
  const todaysPosts = contentGoal?.scheduled_posts?.filter(p => p.day_of_week === todayDayName) || [];
  const todaysLives = contentGoal?.scheduled_lives?.filter(l => l.day_of_week === todayDayName) || [];
  const todaysEngagement = contentGoal?.scheduled_engagement?.filter(e => e.day_of_week === todayDayName) || [];

  const weekPosts = contentGoal?.scheduled_posts || [];
  const weekLives = contentGoal?.scheduled_lives || [];
  const weekEngagement = contentGoal?.scheduled_engagement || [];

  // Count battles from live schedules for today
  const todayBattles = liveSchedules.filter(s => 
    s.live_types?.includes('battle') && 
    (s.recurring_days?.includes(todayDayName) || s.specific_date === today)
  ).length;

  const weekBattles = liveSchedules.filter(s => 
    s.live_types?.includes('battle') && s.is_recurring
  ).length;

  // Engagement contacts due today
  const engagementDueToday = contacts.filter(c => {
    if (!c.engagement_enabled) return false;
    if (c.engagement_frequency === 'daily') return true;
    if (c.engagement_frequency === 'multiple_per_week' && c.engagement_days?.includes(todayDayName)) return true;
    if (c.engagement_frequency === 'weekly') {
      const lastEngaged = c.last_engaged_date ? parseISO(c.last_engaged_date) : null;
      if (!lastEngaged) return true;
      return !isToday(lastEngaged);
    }
    return false;
  });

  const StatCard = ({ icon: Icon, label, todayCount, weekCount, color, link }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold">
                  {todayCount} <span className="text-gray-400 text-lg">/ {weekCount}</span>
                </p>
                <p className="text-xs text-gray-400">today / this week</p>
              </div>
            </div>
            {link && (
              <Link to={createPageUrl(link)}>
                <Button variant="ghost" size="icon">
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-purple-600" />
            TikTok Dashboard
          </h1>
          <p className="text-gray-600">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Swords}
            label="Battles"
            todayCount={todayBattles}
            weekCount={weekBattles}
            color="bg-red-500"
            link="LiveSchedule"
          />
          <StatCard
            icon={FileText}
            label="Posts"
            todayCount={todaysPosts.length}
            weekCount={weekPosts.length}
            color="bg-purple-500"
            link="TikTokGoals"
          />
          <StatCard
            icon={Video}
            label="Lives"
            todayCount={todaysLives.length}
            weekCount={weekLives.length}
            color="bg-pink-500"
            link="TikTokGoals"
          />
          <StatCard
            icon={Users}
            label="Engagement"
            todayCount={engagementDueToday.length}
            weekCount={contacts.filter(c => c.engagement_enabled).length}
            color="bg-blue-500"
            link="TikTokEngagement"
          />
        </div>

        {/* Today's Schedule with Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Today's Lives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Video className="w-5 h-5 text-pink-500" />
                Today's Lives
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaysLives.length === 0 ? (
                <p className="text-gray-500 text-sm">No lives scheduled for today</p>
              ) : (
                todaysLives.map((live, index) => {
                  const originalIndex = weekLives.findIndex(l => l === live);
                  return (
                    <div key={index} className="p-3 bg-purple-50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{live.title || 'Live Stream'}</p>
                          <p className="text-sm text-gray-600">{live.time}</p>
                        </div>
                        <Checkbox
                          checked={live.completed}
                          onCheckedChange={(checked) => 
                            updateGoalMutation.mutate({ 
                              scheduleType: 'scheduled_lives', 
                              index: originalIndex, 
                              field: 'completed', 
                              value: checked 
                            })
                          }
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1">
                          <Checkbox
                            id={`tiktok-event-${index}`}
                            checked={live.added_to_tiktok_events}
                            onCheckedChange={(checked) => 
                              updateGoalMutation.mutate({ 
                                scheduleType: 'scheduled_lives', 
                                index: originalIndex, 
                                field: 'added_to_tiktok_events', 
                                value: checked 
                              })
                            }
                          />
                          <label htmlFor={`tiktok-event-${index}`} className="text-xs text-gray-600">TikTok Event</label>
                        </div>
                        <div className="flex items-center gap-1">
                          <Checkbox
                            id={`discord-${index}`}
                            checked={live.posted_in_discord}
                            onCheckedChange={(checked) => 
                              updateGoalMutation.mutate({ 
                                scheduleType: 'scheduled_lives', 
                                index: originalIndex, 
                                field: 'posted_in_discord', 
                                value: checked 
                              })
                            }
                          />
                          <label htmlFor={`discord-${index}`} className="text-xs text-gray-600">Discord</label>
                        </div>
                        <div className="flex items-center gap-1">
                          <Checkbox
                            id={`story-${index}`}
                            checked={live.shared_to_story}
                            onCheckedChange={(checked) => 
                              updateGoalMutation.mutate({ 
                                scheduleType: 'scheduled_lives', 
                                index: originalIndex, 
                                field: 'shared_to_story', 
                                value: checked 
                              })
                            }
                          />
                          <label htmlFor={`story-${index}`} className="text-xs text-gray-600">Shared Story</label>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Today's Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-purple-500" />
                Today's Posts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaysPosts.length === 0 ? (
                <p className="text-gray-500 text-sm">No posts scheduled for today</p>
              ) : (
                todaysPosts.map((post, index) => {
                  const originalIndex = weekPosts.findIndex(p => p === post);
                  return (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{post.title || 'Post'}</p>
                        <p className="text-sm text-gray-600">{post.time}</p>
                        {post.content_formats?.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {post.content_formats.map(f => (
                              <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Checkbox
                        checked={post.completed}
                        onCheckedChange={(checked) => 
                          updateGoalMutation.mutate({ 
                            scheduleType: 'scheduled_posts', 
                            index: originalIndex, 
                            field: 'completed', 
                            value: checked 
                          })
                        }
                      />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to={createPageUrl('TikTokGoals')}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Content Schedule</span>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl('TikTokEngagement')}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Engagement</span>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl('LiveSchedule')}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Video className="w-5 h-5 text-pink-500" />
                <span className="font-medium">Creator Calendar</span>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl('TikTokContacts')}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">Contacts</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}