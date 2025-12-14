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

import MyDaySection from '../components/dashboard/MyDaySection';
import DailyMotivationBanner from '../components/dashboard/DailyMotivationBanner';
import SpecialEventsCard from '../components/dashboard/SpecialEventsCard';
import SubscribedEventsSection from '../components/dashboard/SubscribedEventsSection';
import NotionTaskPicker from '../components/dashboard/NotionTaskPicker';
import UrgentEventsCard from '../components/dashboard/UrgentEventsCard';
import CalendarIntegrationCard from '../components/dashboard/CalendarIntegrationCard';
import DashboardGoalsSection from '../components/dashboard/DashboardGoalsSection';
import DashboardTasksSection from '../components/dashboard/DashboardTasksSection';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import { format, startOfWeek, addDays } from 'date-fns';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import { useTheme } from '../components/shared/useTheme';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const { bgClass, textClass, cardBgClass, primaryColor } = useTheme();

  // Get current week's Monday
  const getCurrentWeekStart = () => {
    return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        // Verify user activity on each dashboard visit
        base44.functions.invoke('verifyRealUser', {}).catch(() => {});

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

  // Check if onboarding should show
  useEffect(() => {
    if (user && preferences !== undefined) {
      const hasCompletedOnboarding = preferences?.onboarding_completed || 
                                     localStorage.getItem(`onboarding_completed_${user.email}`) === 'true';
      setShowOnboarding(!hasCompletedOnboarding);
    }
  }, [user, preferences]);

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

  // Fetch urgent events for today
  const { data: urgentEvents = [] } = useQuery({
    queryKey: ['urgentEvents', effectiveEmail],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      const events = await base44.entities.ExternalEvent.filter({ created_by: effectiveEmail });
      return events.filter(e => e.is_urgent && (e.date === today || e.date === tomorrow));
    },
    enabled: !!effectiveEmail,
  });

  // Fetch public calendar events
  const { data: publicCalendarData } = useQuery({
    queryKey: ['publicCalendar'],
    queryFn: async () => {
      const response = await base44.functions.invoke('fetchPublicCalendar');
      return response.data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  const todaysPublicEvents = (publicCalendarData?.events || []).filter(event => {
    const eventDate = event.start.split(' ')[0];
    const today = format(new Date(), 'yyyy-MM-dd');
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    return eventDate === today || eventDate === tomorrow;
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences?.id) {
        return await base44.entities.UserPreferences.update(preferences.id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
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
    <>
      <OnboardingModal 
        isOpen={showOnboarding} 
        user={user} 
        onComplete={() => {
          setShowOnboarding(false);
          queryClient.invalidateQueries({ queryKey: ['preferences'] });
        }} 
      />

      <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
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

        {/* Urgent Events - Battles, Training, Important Events */}
        <UrgentEventsCard 
          events={urgentEvents} 
          publicCalendarEvents={todaysPublicEvents}
          alertColor={preferences?.urgent_alert_color || 'red'}
          onColorChange={(color) => {
            updatePreferencesMutation.mutate({ urgent_alert_color: color });
          }}
          userEmail={effectiveEmail}
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

        {/* Tasks Section */}
        <DashboardTasksSection 
          userEmail={effectiveEmail} 
          viewMode={preferences?.dashboard_view_mode || 'detailed'}
        />

        {/* Active Goals Section - Full Card View */}
        <DashboardGoalsSection userEmail={effectiveEmail} />

        {/* Calendar Integration - Google Calendar & Pixel Nuts Events */}
        {(!preferences?.google_calendar_connected) && (
          <CalendarIntegrationCard 
            onConnectGoogleCalendar={async () => {
              // Handle Google Calendar connection
              window.location.href = createPageUrl('Settings') + '?section=google_calendar';
            }}
          />
        )}

        {/* Special Events - Birthdays & Sobriety Anniversaries from Contacts */}
        <SpecialEventsCard contacts={tiktokContacts} />

        {/* Subscribed Creator Events - Shows today's events from followed creators */}
        <SubscribedEventsSection 
          userEmail={user?.email}
          primaryColor={primaryColor}
        />

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
        </div>
      </div>
    </>
  );
}