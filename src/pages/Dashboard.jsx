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
import DailyMotivationBanner from '../components/dashboard/DailyMotivationBanner';
// Weekly content schedule removed per user request
// Content management moved to Content Calendar page
import SpecialEventsCard from '../components/dashboard/SpecialEventsCard';
import SubscribedEventsSection from '../components/dashboard/SubscribedEventsSection';
import NotionTaskPicker from '../components/dashboard/NotionTaskPicker';
import { format, startOfWeek } from 'date-fns';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import { useTheme } from '../components/shared/useTheme';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);
    const [collapsedSections, setCollapsedSections] = useState([]);
  
  const { isDark, bgClass, textClass, cardBgClass, primaryColor } = useTheme();

  // Get current week's Monday
  const getCurrentWeekStart = () => {
    return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        // Check if user is pre-approved and auto-grant TikTok access
        if (userData?.email) {
          const prefs = await base44.entities.UserPreferences.filter({ user_email: userData.email }, '-updated_date');
          if (prefs[0] && !prefs[0].tiktok_access_approved) {
            try {
              const preApproved = await base44.entities.PreApprovedEmail.filter({ 
                email: userData.email.toLowerCase(), 
                is_active: true 
              });
              if (preApproved.length > 0) {
                await base44.entities.UserPreferences.update(prefs[0].id, { tiktok_access_approved: true });
              }
            } catch (e) {
              // Ignore - user may not have access to PreApprovedEmail entity
            }
          }
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

  const contentGoal = null; // Removed feature



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



  // Toggle Google Calendar
  const toggleGoogleCalendarMutation = useMutation({
    mutationFn: async (enabled) => {
      if (preferences?.id) {
        return await base44.entities.UserPreferences.update(preferences.id, { show_google_calendar: enabled });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preferences'] }),
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

  return (
    <div className={`min-h-screen ${bgClass} ${isDark ? 'text-gray-100' : ''} p-4 md:p-8`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Daily Motivation Banner - AT THE TOP */}
        <DailyMotivationBanner
          greetingTypes={preferences?.greeting_types || [preferences?.greeting_type || 'positive_quote']}
          userName={user?.full_name?.split(' ')[0] || 'Friend'}
          struggles={preferences?.mental_health_struggles || []}
          goals={preferences?.improvement_goals || []}
          isBibleBeliever={preferences?.is_bible_believer || preferences?.greeting_type === 'scripture'}
          userEmail={user?.email}
          bibleVersion={preferences?.bible_version || 'NIV'}
          motivationTone={preferences?.motivation_tone || 'uplifting'}
        />

        {/* Special Events - Birthdays & Sobriety Anniversaries from Contacts */}
        <SpecialEventsCard contacts={tiktokContacts} />

        {/* Subscribed Creator Events - Shows today's events from followed creators */}
        <SubscribedEventsSection 
          userEmail={user?.email}
          primaryColor={primaryColor}
        />

        {/* My Day Section - All daily tasks unified */}
        <MyDaySection
          selfCareLog={selfCareLog}
          onToggleTask={(taskId, value) => selfCareMutation.mutate({ taskId, value })}
          onUpdateMealNotes={(noteKey, value) => mealNotesMutation.mutate({ noteKey, value })}
          preferences={{ ...preferences, user_email: user?.email }}
          viewMode={preferences?.dashboard_view_mode || 'detailed'}
          showGoogleCalendar={preferences?.show_google_calendar || false}
          showCreatorCalendarEvents={preferences?.show_creator_calendar_events !== false}
          onToggleGoogleCalendar={(checked) => toggleGoogleCalendarMutation.mutate(checked)}
          onToggleCreatorCalendar={async (checked) => {
            if (preferences?.id) {
              await base44.entities.UserPreferences.update(preferences.id, { show_creator_calendar_events: checked });
              queryClient.invalidateQueries({ queryKey: ['preferences'] });
            }
          }}
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


    </div>
  );
}