import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, LogOut, ChevronDown, ChevronRight, Settings, Calendar, Eye, EyeOff, GripHorizontal, Maximize2, Minimize2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import ManageWidgetsDialog from '../components/dashboard/ManageWidgetsDialog';
import GroupWidget from '../components/dashboard/GroupWidget';
import MyDaySection from '../components/dashboard/MyDaySection';
import DailyMotivationBanner from '../components/dashboard/DailyMotivationBanner';
import SpecialEventsCard from '../components/dashboard/SpecialEventsCard';
import SubscribedEventsSection from '../components/dashboard/SubscribedEventsSection';
import NotionTaskPicker from '../components/dashboard/NotionTaskPicker';
import UrgentEventsCard from '../components/dashboard/UrgentEventsCard';
import CalendarIntegrationCard from '../components/dashboard/CalendarIntegrationCard';
import DashboardGoalsSection from '../components/dashboard/DashboardGoalsSection';
import DashboardTasksSection from '../components/dashboard/DashboardTasksSection';
import DashboardHabitsSection from '../components/dashboard/DashboardHabitsSection';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import CryptoTickerWidget from '../components/widgets/CryptoTickerWidget';
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        base44.functions.invoke('verifyRealUser', {}).catch(() => {});

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
            } catch (e) {}
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

  const [prefKey, setPrefKey] = useState(0);
  useEffect(() => {
    setPrefKey(prev => prev + 1);
  }, [preferences]);

  const realUserEmail = user?.email ? user.email.toLowerCase() : '';
  const adminEmails = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'];
  const isAdmin = adminEmails.includes(realUserEmail);

  useEffect(() => {
    if (user && preferences !== undefined) {
      const hasCompletedOnboarding = preferences?.onboarding_completed || 
                                     localStorage.getItem(`onboarding_completed_${user.email}`) === 'true' ||
                                     isAdmin;
      setShowOnboarding(!hasCompletedOnboarding);

      if (!hasCompletedOnboarding) {
        let referralCode = sessionStorage.getItem('referral_code');
        if (!referralCode) {
          try {
            const storedData = localStorage.getItem('referral_data');
            if (storedData) {
              const parsed = JSON.parse(storedData);
              if (new Date(parsed.expiresAt) > new Date()) {
                referralCode = parsed.code;
              }
            }
          } catch (e) {}
        }
        base44.functions.invoke('initializeReferralCode', { referral_code: referralCode }).catch(() => {});
      }
    }
  }, [user, preferences]);

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

  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  const { data: tiktokContacts = [] } = useQuery({
    queryKey: ['tiktokContacts', effectiveEmail],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: effectiveEmail }),
    enabled: !!effectiveEmail,
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
        return await base44.entities.DailySelfCareLog.create({ date: today, [taskId]: value });
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
        return await base44.entities.DailySelfCareLog.create({ date: today, [noteKey]: value });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selfCareToday'] });
    },
  });

  const toggleGoogleCalendarMutation = useMutation({
    mutationFn: async (enabled) => {
      if (preferences?.id) {
        return await base44.entities.UserPreferences.update(preferences.id, { show_google_calendar: enabled });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preferences'] }),
  });

  const toggleSectionCollapse = (sectionId) => {
    setCollapsedSections(prev => 
      prev.includes(sectionId) ? prev.filter(s => s !== sectionId) : [...prev, sectionId]
    );
  };

  const isSectionCollapsed = (sectionId) => collapsedSections.includes(sectionId);

  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  
  const defaultLayout = [
    { id: 'daily_motivation', visible: true, order: 0, width: 'full' },
    { id: 'my_day', visible: true, order: 1, width: 'full' },
    { id: 'tasks', visible: true, order: 2, width: 'half' },
    { id: 'goals', visible: true, order: 3, width: 'half' },
    { id: 'habits', visible: true, order: 4, width: 'half' },
    { id: 'calendar_integration', visible: true, order: 5, width: 'half' },
    { id: 'special_events', visible: true, order: 6, width: 'half' },
    { id: 'subscribed_events', visible: true, order: 7, width: 'half' }
  ];

  const [layout, setLayout] = useState([]);

  useEffect(() => {
    const prefLayout = preferences?.dashboard_layout || [];
    const merged = [...prefLayout];
    defaultLayout.forEach(def => {
      const existing = merged.find(p => p.id === def.id);
      if (!existing) {
        merged.push(def);
      } else if (!existing.width) {
        existing.width = def.width;
      }
    });
    setLayout(merged.sort((a, b) => a.order - b.order));
  }, [preferences?.dashboard_layout]);

  const saveLayout = (newLayout) => {
    setLayout(newLayout);
    updatePreferencesMutation.mutate({ dashboard_layout: newLayout });
    setShowCustomizeModal(false);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const newLayout = Array.from(layout);
    const [reorderedItem] = newLayout.splice(result.source.index, 1);
    newLayout.splice(result.destination.index, 0, reorderedItem);

    // Update orders
    const updatedLayout = newLayout.map((item, index) => ({
      ...item,
      order: index
    }));

    setLayout(updatedLayout);
    updatePreferencesMutation.mutate({ dashboard_layout: updatedLayout });
  };

  const toggleWidgetWidth = (widgetId) => {
    const updatedLayout = layout.map(item => {
      if (item.id === widgetId) {
        return { ...item, width: item.width === 'full' ? 'half' : 'full' };
      }
      return item;
    });
    setLayout(updatedLayout);
    updatePreferencesMutation.mutate({ dashboard_layout: updatedLayout });
  };

  const renderWidget = (widget) => {
    if (!widget.visible) return null;

    switch (widget.id) {
      case 'daily_motivation':
        return (
          <DailyMotivationBanner
            key={prefKey}
            greetingTypes={preferences?.greeting_types || [preferences?.greeting_type || 'positive_quote']}
            userName={user?.full_name?.split(' ')[0] || 'Friend'}
            struggles={preferences?.mental_health_struggles || []}
            goals={preferences?.improvement_goals || []}
            isBibleBeliever={preferences?.enable_bible_options !== false}
            userEmail={user?.email}
            bibleVersion={preferences?.bible_version || 'NIV'}
            motivationTone={preferences?.content_tone ? preferences.content_tone.join(', ') : 'humorous'}
            primaryColor={primaryColor}
            accentColor={preferences?.accent_color || '#bd84f5'}
            preferences={preferences}
          />
        );
      case 'my_day':
        return (
          <MyDaySection
            selfCareLog={selfCareLog}
            onToggleTask={(taskId, value) => selfCareMutation.mutate({ taskId, value })}
            onUpdateMealNotes={(noteKey, value) => mealNotesMutation.mutate({ noteKey, value })}
            preferences={{ ...preferences, user_email: user?.email }}
            viewMode={'compact'}
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
        );
      case 'tasks':
        return (
          <DashboardTasksSection 
            userEmail={effectiveEmail} 
            viewMode={preferences?.dashboard_view_mode || 'detailed'}
          />
        );
      case 'goals':
        return <DashboardGoalsSection userEmail={effectiveEmail} />;
      case 'habits':
        return <DashboardHabitsSection userEmail={effectiveEmail} />;
      case 'calendar_integration':
        return (!preferences?.google_calendar_connected) ? (
          <CalendarIntegrationCard 
            onConnectGoogleCalendar={async () => {
              window.location.href = createPageUrl('Settings') + '?section=google_calendar';
            }}
          />
        ) : null;
      case 'special_events':
        return <SpecialEventsCard contacts={tiktokContacts} />;
      case 'subscribed_events':
        return <SubscribedEventsSection userEmail={user?.email} primaryColor={primaryColor} />;
      case 'crypto_ticker':
        return null; // Moved to Creator Groups
      default:
        if (widget.type === 'group') {
          return <GroupWidget widget={widget} userEmail={user?.email} />;
        }
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

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
          
          {/* Customizer removed as requested */}

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="dashboard-grid" direction="horizontal">
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 grid-flow-row-dense"
                >
                  {layout.map((widget, index) => (
                    <Draggable key={widget.id} draggableId={widget.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`relative group ${
                            widget.width === 'full' 
                              ? 'col-span-1 md:col-span-2' 
                              : 'col-span-1'
                          }`}
                        >
                          <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => toggleWidgetWidth(widget.id)}
                              className="p-1.5 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-md shadow-sm hover:bg-white dark:hover:bg-black/70 cursor-pointer"
                              title={widget.width === 'full' ? "Make half width" : "Make full width (Double Wide!)"}
                            >
                              {widget.width === 'full' ? (
                                <Minimize2 className="w-4 h-4 text-gray-500" />
                              ) : (
                                <Maximize2 className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                            <div 
                              {...provided.dragHandleProps}
                              className="p-1.5 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-md shadow-sm cursor-grab active:cursor-grabbing hover:bg-white dark:hover:bg-black/70"
                            >
                              <GripHorizontal className="w-4 h-4 text-gray-500" />
                            </div>
                          </div>
                          {renderWidget(widget)}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

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

      <DashboardCustomizer
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        currentLayout={layout}
        onSave={saveLayout}
      />
    </>
  );
}