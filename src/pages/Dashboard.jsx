import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, LogOut, ChevronDown, ChevronRight, Settings, Calendar, Eye, EyeOff } from 'lucide-react';
import QuickStats from '../components/dashboard/QuickStats';
import MyDaySection from '../components/dashboard/MyDaySection';
import WeeklyGoalCard from '../components/tiktok/WeeklyGoalCard';
import PostScheduleModal from '../components/tiktok/PostScheduleModal';
import LiveScheduleModal from '../components/tiktok/LiveScheduleModal';
import EngagementScheduleModal from '../components/tiktok/EngagementScheduleModal';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import SpecialEventsCard from '../components/dashboard/SpecialEventsCard';
import NotionTaskPicker from '../components/dashboard/NotionTaskPicker';
import { format, startOfWeek } from 'date-fns';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import { useTheme } from '../components/shared/useTheme';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showPostsModal, setShowPostsModal] = useState(false);
    const [showLivesModal, setShowLivesModal] = useState(false);
    const [showEngagementModal, setShowEngagementModal] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showDashboardSettings, setShowDashboardSettings] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState([]);
  
  const { isDark, bgClass, textClass, cardBgClass } = useTheme();

  // Get current week's Monday
  const getCurrentWeekStart = () => {
    return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        // Check if onboarding completed - get most recent preferences
        const prefs = await base44.entities.UserPreferences.filter({ user_email: userData.email }, '-updated_date');
        // Check if ANY preference record has onboarding_completed = true
        const hasCompletedOnboarding = prefs.some(p => p.onboarding_completed === true);
        if (!hasCompletedOnboarding) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Auth error:', error);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const { data: preferences } = useQuery({
    queryKey: ['preferences', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  // Fetch or create content goal for current week (auto-generate from template)
  const { data: contentGoal } = useQuery({
    queryKey: ['contentGoal', getCurrentWeekStart()],
    queryFn: async () => {
      const weekStart = getCurrentWeekStart();
      const goals = await base44.entities.ContentGoal.filter({ 
        week_starting: weekStart,
        created_by: user.email 
      });
      
      if (goals[0]) return goals[0];
      
      // No goal for this week - check for a template
      const templates = await base44.entities.ContentScheduleTemplate.filter({ 
        created_by: user.email 
      });
      
      if (templates[0]) {
        // Create new week's goal from template (reset completed status)
        const template = templates[0];
        const newGoal = await base44.entities.ContentGoal.create({
          week_starting: weekStart,
          scheduled_posts: (template.scheduled_posts || []).map(p => ({ ...p, completed: false })),
          scheduled_lives: (template.scheduled_lives || []).map(l => ({ ...l, completed: false })),
          scheduled_engagement: (template.scheduled_engagement || []).map(e => ({ ...e, completed: false })),
          notes: template.notes || ''
        });
        return newGoal;
      }
      
      return null;
    },
    enabled: !!user,
  });

  const { data: todaysWater } = useQuery({
    queryKey: ['waterToday', format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const logs = await base44.entities.WaterLog.filter({ 
        date: format(new Date(), 'yyyy-MM-dd'),
        created_by: user.email 
      });
      return logs[0] || null;
    },
    enabled: !!user,
  });

  const { data: todaysMoodLogs } = useQuery({
    queryKey: ['moodToday', format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const logs = await base44.entities.MoodLog.filter({ 
        date: format(new Date(), 'yyyy-MM-dd'),
        created_by: user.email 
      });
      return logs;
    },
    enabled: !!user,
  });

  const { data: todaysJournal } = useQuery({
    queryKey: ['journalToday', format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const entries = await base44.entities.JournalEntry.filter({ 
        date: format(new Date(), 'yyyy-MM-dd'),
        created_by: user.email 
      });
      return entries[0] || null;
    },
    enabled: !!user,
  });

  const { data: selfCareLog } = useQuery({
    queryKey: ['selfCareToday', format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const logs = await base44.entities.DailySelfCareLog.filter({ 
        date: format(new Date(), 'yyyy-MM-dd'),
        created_by: user.email 
      });
      return logs[0] || null;
    },
    enabled: !!user,
  });

  // Get effective email for impersonation support
  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  const { data: tiktokContacts = [] } = useQuery({
    queryKey: ['tiktokContacts', effectiveEmail],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: effectiveEmail }),
    enabled: !!effectiveEmail,
  });

  const selfCareMutation = useMutation({
    mutationFn: async ({ taskId, value }) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      if (selfCareLog) {
        return await base44.entities.DailySelfCareLog.update(selfCareLog.id, { [taskId]: value });
      } else {
        return await base44.entities.DailySelfCareLog.create({ 
          date: today, 
          [taskId]: value 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selfCareToday'] });
    },
    });

    const mealNotesMutation = useMutation({
    mutationFn: async ({ noteKey, value }) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      if (selfCareLog) {
        return await base44.entities.DailySelfCareLog.update(selfCareLog.id, { [noteKey]: value });
      } else {
        return await base44.entities.DailySelfCareLog.create({ 
          date: today, 
          [noteKey]: value 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selfCareToday'] });
    },
    });

  // Save schedule by type
  const saveScheduleMutation = useMutation({
    mutationFn: async ({ field, data }) => {
      // Also update template
      const templates = await base44.entities.ContentScheduleTemplate.filter({ created_by: user.email });
      const templateUpdate = { [field]: data };
      
      if (templates[0]) {
        await base44.entities.ContentScheduleTemplate.update(templates[0].id, templateUpdate);
      } else {
        await base44.entities.ContentScheduleTemplate.create(templateUpdate);
      }
      
      // Update current week's goal
      if (contentGoal) {
        return await base44.entities.ContentGoal.update(contentGoal.id, { [field]: data });
      } else {
        return await base44.entities.ContentGoal.create({
          week_starting: getCurrentWeekStart(),
          [field]: data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentGoal'] });
      setShowPostsModal(false);
      setShowLivesModal(false);
      setShowEngagementModal(false);
    },
  });

  const incrementGoalMutation = useMutation({
    mutationFn: async (field) => {
      const updateData = {
        [`${field}_completed`]: contentGoal[`${field}_completed`] + 1
      };
      return await base44.entities.ContentGoal.update(contentGoal.id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentGoal'] });
    },
  });

  // Toggle day completion for a schedule item
  const toggleDayCompleteMutation = useMutation({
    mutationFn: async ({ field, index, day }) => {
      if (!contentGoal) return;
      const schedules = [...(contentGoal[field] || [])];
      const schedule = { ...schedules[index] };
      const completedDays = schedule.completed_days || [];
      
      if (completedDays.includes(day)) {
        schedule.completed_days = completedDays.filter(d => d !== day);
      } else {
        schedule.completed_days = [...completedDays, day];
      }
      
      schedules[index] = schedule;
      return await base44.entities.ContentGoal.update(contentGoal.id, { [field]: schedules });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentGoal'] });
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const latestMood = todaysMoodLogs && todaysMoodLogs.length > 0 
    ? todaysMoodLogs[todaysMoodLogs.length - 1].mood 
    : null;

  // Dashboard section visibility
  const toggleSectionCollapse = (sectionId) => {
    setCollapsedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isSectionCollapsed = (sectionId) => collapsedSections.includes(sectionId);

  // Toggle Google Calendar
  const toggleGoogleCalendarMutation = useMutation({
    mutationFn: async (enabled) => {
      if (preferences?.id) {
        return await base44.entities.UserPreferences.update(preferences.id, { show_google_calendar: enabled });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preferences'] }),
  });

  return (
    <div className={`min-h-screen ${bgClass} ${isDark ? 'text-gray-100' : ''} p-4 md:p-8`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Dashboard Settings Toggle */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDashboardSettings(!showDashboardSettings)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Settings className="w-4 h-4 mr-1" />
            Customize
          </Button>
        </div>

        {/* Dashboard Settings Panel */}
        {showDashboardSettings && (
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Dashboard Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <Label htmlFor="google-cal" className="text-sm">Show Google Calendar events</Label>
                </div>
                <Switch
                  id="google-cal"
                  checked={preferences?.show_google_calendar || false}
                  onCheckedChange={(checked) => toggleGoogleCalendarMutation.mutate(checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-pink-500" />
                  <Label htmlFor="creator-cal" className="text-sm">Show creator calendar reminders</Label>
                </div>
                <Switch
                  id="creator-cal"
                  checked={preferences?.show_creator_calendar_events !== false}
                  onCheckedChange={async (checked) => {
                    if (preferences?.id) {
                      await base44.entities.UserPreferences.update(preferences.id, { show_creator_calendar_events: checked });
                      queryClient.invalidateQueries({ queryKey: ['preferences'] });
                    }
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">
                Toggle sections below by clicking their headers. Your preferences are saved automatically.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Special Events - Birthdays & Sobriety Anniversaries */}
        <Collapsible open={!isSectionCollapsed('special-events')}>
          <CollapsibleTrigger 
            className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => toggleSectionCollapse('special-events')}
          >
            <span className="text-sm font-medium text-gray-600">Special Events</span>
            {isSectionCollapsed('special-events') ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SpecialEventsCard contacts={tiktokContacts} />
          </CollapsibleContent>
        </Collapsible>

        {/* My Day Section - All daily tasks unified */}
        <MyDaySection
          selfCareLog={selfCareLog}
          onToggleTask={(taskId, value) => selfCareMutation.mutate({ taskId, value })}
          onUpdateMealNotes={(noteKey, value) => mealNotesMutation.mutate({ noteKey, value })}
          preferences={{ ...preferences, user_email: user?.email }}
          viewMode={preferences?.dashboard_view_mode || 'detailed'}
        />

        <Collapsible open={!isSectionCollapsed('quick-stats')}>
          <CollapsibleTrigger 
            className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => toggleSectionCollapse('quick-stats')}
          >
            <span className="text-sm font-medium text-gray-600">Quick Stats</span>
            {isSectionCollapsed('quick-stats') ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <QuickStats
              contentGoal={contentGoal}
              waterToday={todaysWater}
              todaysMood={latestMood}
              journalToday={todaysJournal}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Notion Task Picker - Only for admin account */}
        {user?.email?.toLowerCase() === 'pixelnutscreative@gmail.com' && (
          <Collapsible open={!isSectionCollapsed('notion-tasks')}>
            <CollapsibleTrigger 
              className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => toggleSectionCollapse('notion-tasks')}
            >
              <span className="text-sm font-medium text-gray-600">Notion Tasks</span>
              {isSectionCollapsed('notion-tasks') ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <NotionTaskPicker userEmail={user?.email} />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Weekly Content Schedule */}
        <Collapsible open={!isSectionCollapsed('weekly-schedule')}>
          <CollapsibleTrigger 
            className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => toggleSectionCollapse('weekly-schedule')}
          >
            <span className="text-sm font-medium text-gray-600">Weekly Content Schedule</span>
            {isSectionCollapsed('weekly-schedule') ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <WeeklyGoalCard
              goal={contentGoal}
              onEditPosts={() => setShowPostsModal(true)}
              onEditLives={() => setShowLivesModal(true)}
              onEditEngagement={() => setShowEngagementModal(true)}
              onToggleDayComplete={(field, index, day) => toggleDayCompleteMutation.mutate({ field, index, day })}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Quick action buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            className="h-20 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
            onClick={() => navigate(createPageUrl('Wellness'))}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">💧</div>
              <div className="font-semibold">Log Water</div>
            </div>
          </Button>
          <Button 
            className="h-20 bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg"
            onClick={() => navigate(createPageUrl('Wellness'))}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">😊</div>
              <div className="font-semibold">Log Mood</div>
            </div>
          </Button>
          <Button 
            className="h-20 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
            onClick={() => navigate(createPageUrl('Journal'))}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">📖</div>
              <div className="font-semibold">Journal</div>
            </div>
          </Button>
          <Button 
            className="h-20 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
            onClick={() => navigate(createPageUrl('Goals'))}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">🎯</div>
              <div className="font-semibold">My Goals</div>
            </div>
          </Button>
        </div>
      </div>

      <PostScheduleModal
        isOpen={showPostsModal}
        onClose={() => setShowPostsModal(false)}
        posts={contentGoal?.scheduled_posts || []}
        onSave={(data) => saveScheduleMutation.mutate({ field: 'scheduled_posts', data })}
      />
      
      <LiveScheduleModal
        isOpen={showLivesModal}
        onClose={() => setShowLivesModal(false)}
        lives={contentGoal?.scheduled_lives || []}
        onSave={(data) => saveScheduleMutation.mutate({ field: 'scheduled_lives', data })}
      />
      
      <EngagementScheduleModal
        isOpen={showEngagementModal}
        onClose={() => setShowEngagementModal(false)}
        engagements={contentGoal?.scheduled_engagement || []}
        onSave={(data) => saveScheduleMutation.mutate({ field: 'scheduled_engagement', data })}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        user={user}
        onComplete={async () => {
          setShowOnboarding(false);
          await queryClient.invalidateQueries({ queryKey: ['preferences'] });
          await queryClient.refetchQueries({ queryKey: ['preferences', user?.email] });
        }}
      />
    </div>
  );
}