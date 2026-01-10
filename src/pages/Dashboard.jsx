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
import GreetingCard from '../components/dashboard/GreetingCard';
import SpecialDatesWidget from '../components/dashboard/SpecialDatesWidget';
import TikTokBattlesWidget from '../components/dashboard/TikTokBattlesWidget';
import LiveScheduleWidget from '../components/dashboard/LiveScheduleWidget';
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
      } catch (error) {
        console.error('Auth error:', error);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Auto-approve TikTok access if eligible
  useEffect(() => {
    const checkAccess = async () => {
      if (user?.email && preferences && !preferences.tiktok_access_approved) {
        try {
          const preApproved = await base44.entities.PreApprovedEmail.filter({ 
            email: user.email.toLowerCase(), 
            is_active: true 
          });
          if (preApproved.length > 0) {
            await base44.entities.UserPreferences.update(preferences.id, { tiktok_access_approved: true });
            queryClient.invalidateQueries({ queryKey: ['preferences'] });
          }
        } catch (e) {}
      }
    };
    checkAccess();
  }, [user, preferences]);

  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  const { data: preferences } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const [prefKey, setPrefKey] = useState(0);
  useEffect(() => {
    setPrefKey(prev => prev + 1);
  }, [preferences]);

  const realUserEmail = user?.email ? user.email.toLowerCase() : '';
  const adminEmails = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'];
  const isAdmin = adminEmails.includes(realUserEmail);

  // Check onboarding status but DO NOT auto-show the modal
  const hasCompletedOnboarding = useMemo(() => {
    if (!user || preferences === undefined) return true; // Don't prompt if loading
    return !!(preferences?.onboarding_completed || 
             localStorage.getItem(`onboarding_completed_${user.email}`) === 'true' ||
             isAdmin);
  }, [user, preferences, isAdmin]);

  // Handle referral code initialization silently in background if needed
  useEffect(() => {
    if (user && !hasCompletedOnboarding) {
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
  }, [user, hasCompletedOnboarding]);

  const DEFAULT_MODULES = [
    'my_resources', 'my_groups', 'pixels_place', 
    'quick_notes', 'tasks', 'habits', 'goals', 'vision_board', 'journal', 'finance',
    'people', 'parenting', 'care_reminders', 'pets',
    'prayer', 'holy_hitmakers', 
    'mental_health', 'wellness', 'supplements', 'medications', 'activity',
    'content_creator_center', 'motivations', 'content_marketplace', 'ai_music_suite', 'tiktok',
    'share_earn'
  ];

  const enabledModules = preferences?.enabled_modules || DEFAULT_MODULES;

  const { data: selfCareLog } = useQuery({
    queryKey: ['selfCareToday', format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const logs = await base44.entities.DailySelfCareLog.filter({ 
        date: format(new Date(), 'yyyy-MM-dd'),
        created_by: user.email 
      });
      return logs[0] || null;
    },
    enabled: !!user && enabledModules.includes('wellness'),
  });

  const { data: tiktokContacts = [] } = useQuery({
    queryKey: ['tiktokContacts', effectiveEmail],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: effectiveEmail }),
    enabled: !!effectiveEmail && enabledModules.includes('people'),
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

  const [showManageModal, setShowManageModal] = useState(false);
  
  // --- DRAG AND DROP / LAYOUT LOGIC ---
  const defaultLayout = [
    { id: 'daily_motivation', visible: true, order: 0, width: 'full' },
    { id: 'my_day', visible: true, order: 1, width: 'full' },
    { id: 'tasks', visible: true, order: 2, width: 'half' },
    { id: 'goals', visible: true, order: 3, width: 'half' },
    { id: 'habits', visible: true, order: 4, width: 'half' },
    { id: 'calendar_integration', visible: true, order: 5, width: 'half' },
    { id: 'special_events', visible: true, order: 6, width: 'half' },
    { id: 'subscribed_events', visible: true, order: 7, width: 'half' },
    { id: 'special_dates', visible: true, order: 8, width: 'half' },
    { id: 'tiktok_battles', visible: true, order: 9, width: 'half' },
    { id: 'live_schedule', visible: true, order: 10, width: 'half' }
  ];

  const [layout, setLayout] = useState([]);

  // Check visibility first
  const isWidgetVisible = (widget) => {
    if (!widget.visible) return false;
    // enabledModules is defined in component scope with defaults

    if (widget.id === 'tasks' && !enabledModules.includes('tasks')) return false;
    if (widget.id === 'goals' && !enabledModules.includes('goals')) return false;
    if (widget.id === 'habits' && !enabledModules.includes('habits')) return false;
    if (widget.id === 'my_day' && !enabledModules.includes('wellness')) return false;
    if (widget.id === 'special_events' && !enabledModules.includes('people')) return false;
    if (widget.id === 'daily_motivation' && !enabledModules.includes('motivations')) return false;
    if (widget.id === 'special_dates' && !enabledModules.includes('people')) return false;
    if ((widget.id === 'tiktok_battles' || widget.id === 'live_schedule') && !enabledModules.includes('tiktok')) return false;
    if (widget.id === 'crypto_ticker') return false; 
    
    return true;
  };

  // 1. Initialize layout from preferences or defaults
  useEffect(() => {
    const prefLayout = preferences?.dashboard_layout || [];
    const merged = [...prefLayout];
    
    // Ensure all default widgets exist in layout
    defaultLayout.forEach(def => {
      const existing = merged.find(p => p.id === def.id);
      if (!existing) {
        merged.push(def);
      } else {
        // Ensure default props exist if missing
        if (!existing.width) existing.width = def.width;
      }
    });

    // Sort by order initially
    merged.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Assign 'column' property if missing (migration strategy)
    // We'll distribute half-width items to left/right columns alternately
    let halfWidthCounter = 0;
    const mapped = merged.map((item, index) => {
      // If column is already set, keep it
      if (item.column) return item;

      // If width is full, force to 'top' zone for now (or keep as full width stack)
      if (item.width === 'full') {
        return { ...item, column: 'top', order: index };
      }

      // Distribute half width items
      const col = halfWidthCounter % 2 === 0 ? 'left' : 'right';
      halfWidthCounter++;
      return { ...item, column: col, order: index };
    });

    setLayout(mapped);
  }, [preferences?.dashboard_layout]);

  // 2. Compute columns for rendering
  // We filter by visibility AND group by column
  const topWidgets = layout.filter(w => w.column === 'top' && isWidgetVisible(w)).sort((a, b) => a.order - b.order);
  const leftWidgets = layout.filter(w => w.column === 'left' && isWidgetVisible(w)).sort((a, b) => a.order - b.order);
  const rightWidgets = layout.filter(w => w.column === 'right' && isWidgetVisible(w)).sort((a, b) => a.order - b.order);

  // 3. Handle Drag End
  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Helper to get list by ID
    const getList = (id) => {
        if (id === 'top') return [...topWidgets];
        if (id === 'left') return [...leftWidgets];
        if (id === 'right') return [...rightWidgets];
        return [];
    };

    const sourceList = getList(source.droppableId);
    const destList = source.droppableId === destination.droppableId ? sourceList : getList(destination.droppableId);

    // Remove from source
    const [movedItem] = sourceList.splice(source.index, 1);

    // Update item properties based on destination
    const updatedItem = { ...movedItem };
    updatedItem.column = destination.droppableId;
    
    // Auto-adjust width if moving to/from top
    if (destination.droppableId === 'top') {
        updatedItem.width = 'full';
    } else {
        updatedItem.width = 'half'; // Force half width in columns to prevent overflow
    }

    // Insert into destination
    destList.splice(destination.index, 0, updatedItem);

    // Reconstruct entire layout array
    // We need to merge the modified lists back with the hidden/other items
    const visibleTop = source.droppableId === 'top' ? (destination.droppableId === 'top' ? destList : sourceList) : (destination.droppableId === 'top' ? destList : topWidgets);
    const visibleLeft = source.droppableId === 'left' ? (destination.droppableId === 'left' ? destList : sourceList) : (destination.droppableId === 'left' ? destList : leftWidgets);
    const visibleRight = source.droppableId === 'right' ? (destination.droppableId === 'right' ? destList : sourceList) : (destination.droppableId === 'right' ? destList : rightWidgets);

    // Re-index orders within each visible list
    const reindexedTop = visibleTop.map((item, idx) => ({ ...item, order: idx }));
    const reindexedLeft = visibleLeft.map((item, idx) => ({ ...item, order: idx }));
    const reindexedRight = visibleRight.map((item, idx) => ({ ...item, order: idx }));

    // Get hidden items (not visible)
    const hiddenItems = layout.filter(w => !isWidgetVisible(w));

    // Combine all
    const newLayout = [
        ...reindexedTop,
        ...reindexedLeft,
        ...reindexedRight,
        ...hiddenItems
    ];

    setLayout(newLayout);
    updatePreferencesMutation.mutate({ dashboard_layout: newLayout });
  };

  const saveLayout = (newLayout) => {
    setLayout(newLayout);
    updatePreferencesMutation.mutate({ dashboard_layout: newLayout });
  };

  const toggleWidgetWidth = (widgetId) => {
    // In this new layout, toggling width essentially moves it between 'top' (full) and 'left/right' (half)
    // We'll default to moving 'full' -> 'left', and 'half' -> 'top'
    const item = layout.find(i => i.id === widgetId);
    if (!item) return;

    let newColumn = item.column;
    let newWidth = item.width;

    if (item.width === 'full') {
        newWidth = 'half';
        newColumn = 'left'; // Default to left column
    } else {
        newWidth = 'full';
        newColumn = 'top';
    }

    const updatedLayout = layout.map(w => {
        if (w.id === widgetId) {
            return { ...w, width: newWidth, column: newColumn };
        }
        return w;
    });

    setLayout(updatedLayout);
    updatePreferencesMutation.mutate({ dashboard_layout: updatedLayout });
  };

  const renderWidget = (widget) => {
    // Visibility check already handled by visibleLayout filtering
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
      case 'special_dates':
        return <SpecialDatesWidget userEmail={effectiveEmail} />;
      case 'tiktok_battles':
        return <TikTokBattlesWidget userEmail={effectiveEmail} />;
      case 'live_schedule':
        return <LiveScheduleWidget userEmail={effectiveEmail} />;
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
    // Show Greeting Card while loading
    // We use a safe default if user/prefs aren't fully loaded yet
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-500 animate-pulse">Setting up your day...</p>
          </div>
          <GreetingCard 
            greetingType={preferences?.greeting_type || 'positive_quote'} 
            userName={user?.full_name?.split(' ')[0] || 'Friend'} 
          />
        </div>
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
          
          {/* Onboarding Call-to-Action (Manual Trigger) */}
          {!hasCompletedOnboarding && (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg mb-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome to Let's Thrive!</h2>
                  <p className="text-purple-100">
                    Let's personalize your dashboard to help you crush your goals.
                  </p>
                </div>
                <Button 
                  size="lg" 
                  onClick={() => setShowOnboarding(true)}
                  className="bg-white text-purple-600 hover:bg-purple-50 font-bold border-0"
                >
                  Start Setup
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end mb-4">
             <Button 
               variant="outline" 
               size="sm" 
               onClick={() => setShowManageModal(true)}
               className="gap-2"
             >
               <Settings className="w-4 h-4" /> Manage Widgets
             </Button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="space-y-6">
              {/* Top Section (Full Width) */}
              <Droppable droppableId="top">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-6 min-h-[10px]"
                  >
                    {topWidgets.map((widget, index) => (
                      <Draggable key={widget.id} draggableId={widget.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="relative group w-full"
                          >
                             {/* Controls */}
                            <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => toggleWidgetWidth(widget.id)}
                                className="p-1.5 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-md shadow-sm hover:bg-white dark:hover:bg-black/70 cursor-pointer"
                                title="Make half width"
                              >
                                <Minimize2 className="w-4 h-4 text-gray-500" />
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

              {/* Two Column Section */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left Column */}
                <Droppable droppableId="left">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex-1 space-y-6 min-h-[100px]"
                    >
                      {leftWidgets.map((widget, index) => (
                        <Draggable key={widget.id} draggableId={widget.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="relative group w-full"
                            >
                              <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => toggleWidgetWidth(widget.id)}
                                  className="p-1.5 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-md shadow-sm hover:bg-white dark:hover:bg-black/70 cursor-pointer"
                                  title="Make full width"
                                >
                                  <Maximize2 className="w-4 h-4 text-gray-500" />
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

                {/* Right Column */}
                <Droppable droppableId="right">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex-1 space-y-6 min-h-[100px]"
                    >
                      {rightWidgets.map((widget, index) => (
                        <Draggable key={widget.id} draggableId={widget.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="relative group w-full"
                            >
                              <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => toggleWidgetWidth(widget.id)}
                                  className="p-1.5 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-md shadow-sm hover:bg-white dark:hover:bg-black/70 cursor-pointer"
                                  title="Make full width"
                                >
                                  <Maximize2 className="w-4 h-4 text-gray-500" />
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
              </div>
            </div>
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

      <ManageWidgetsDialog
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        layout={layout}
        onUpdateLayout={saveLayout}
        userEmail={user?.email}
      />
    </>
  );
}