import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';
import GreetingCard from '../components/dashboard/GreetingCard';
import QuickStats from '../components/dashboard/QuickStats';
import DailyAffirmation from '../components/dashboard/DailyAffirmation';
import SelfCareChecklist from '../components/wellness/SelfCareChecklist';
import WeeklyGoalCard from '../components/tiktok/WeeklyGoalCard';
import GoalEditModal from '../components/tiktok/GoalEditModal';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import SpecialEventsCard from '../components/dashboard/SpecialEventsCard';
import { format, startOfWeek } from 'date-fns';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const { data: contentGoal } = useQuery({
    queryKey: ['contentGoal', getCurrentWeekStart()],
    queryFn: async () => {
      const goals = await base44.entities.ContentGoal.filter({ 
        week_starting: getCurrentWeekStart(),
        created_by: user.email 
      });
      return goals[0] || null;
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

  const createOrUpdateGoalMutation = useMutation({
    mutationFn: async (goalData) => {
      if (contentGoal) {
        return await base44.entities.ContentGoal.update(contentGoal.id, goalData);
      } else {
        return await base44.entities.ContentGoal.create({
          week_starting: getCurrentWeekStart(),
          ...goalData,
          posts_completed: 0,
          lives_completed: 0,
          shop_lives_completed: 0,
          engagement_completed: 0,
          scheduled_posts: goalData.scheduled_posts || [],
          scheduled_lives: goalData.scheduled_lives || [],
          scheduled_engagement: goalData.scheduled_engagement || []
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentGoal'] });
      setShowGoalModal(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <GreetingCard 
          greetingType={preferences?.greeting_type || 'positive_quote'}
          userName={user?.full_name?.split(' ')[0] || 'Friend'}
        />

        {preferences?.show_daily_affirmations && (
          <DailyAffirmation 
            userName={user?.full_name?.split(' ')[0] || 'Friend'} 
            struggles={preferences?.mental_health_struggles || []}
            improvements={preferences?.improvement_goals || []}
          />
        )}

        {/* Special Events - Birthdays & Sobriety Anniversaries */}
        <SpecialEventsCard contacts={tiktokContacts} />

        {/* Self-Care Checklist (compact) */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <SelfCareChecklist
            selfCareLog={selfCareLog}
            onToggleTask={(taskId, value) => selfCareMutation.mutate({ taskId, value })}
            requiredTasks={preferences?.required_self_care_tasks || []}
            preferences={preferences}
            compact={true}
          />
        </div>

        <QuickStats
          contentGoal={contentGoal}
          waterToday={todaysWater}
          todaysMood={latestMood}
          journalToday={todaysJournal}
        />

        <div className="grid md:grid-cols-2 gap-8">
          <WeeklyGoalCard
            goal={contentGoal}
            onEdit={() => setShowGoalModal(true)}
            onIncrement={(field) => incrementGoalMutation.mutate(field)}
          />

          <div className="space-y-4">
            {/* Quick action buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                className="h-24 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
                onClick={() => navigate(createPageUrl('Wellness'))}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">💧</div>
                  <div className="font-semibold">Log Water</div>
                </div>
              </Button>
              <Button 
                className="h-24 bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg"
                onClick={() => navigate(createPageUrl('Wellness'))}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">😊</div>
                  <div className="font-semibold">Log Mood</div>
                </div>
              </Button>
              <Button 
                className="h-24 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                onClick={() => navigate(createPageUrl('Journal'))}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">📖</div>
                  <div className="font-semibold">Journal</div>
                </div>
              </Button>
              <Button 
                className="h-24 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
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
      </div>

      <GoalEditModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        currentGoal={contentGoal}
        onSave={(data) => createOrUpdateGoalMutation.mutate(data)}
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