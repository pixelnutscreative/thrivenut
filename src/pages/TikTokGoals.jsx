import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, Calendar } from 'lucide-react';
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { motion } from 'framer-motion';
import WeeklyGoalCard from '../components/tiktok/WeeklyGoalCard';
import GoalEditModal from '../components/tiktok/GoalEditModal';

export default function TikTokGoals() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const getWeekStart = (offset = 0) => {
    const date = addWeeks(new Date(), offset);
    return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  };

  const currentWeekStart = getWeekStart(selectedWeekOffset);

  const { data: contentGoal } = useQuery({
    queryKey: ['contentGoal', currentWeekStart],
    queryFn: async () => {
      const goals = await base44.entities.ContentGoal.filter({ 
        week_starting: currentWeekStart,
        created_by: user.email 
      });
      return goals[0] || null;
    },
    enabled: !!user,
  });

  const { data: allGoals } = useQuery({
    queryKey: ['allContentGoals'],
    queryFn: async () => {
      return await base44.entities.ContentGoal.list('-week_starting', 12);
    },
    enabled: !!user,
  });

  const createOrUpdateGoalMutation = useMutation({
    mutationFn: async (goalData) => {
      if (contentGoal) {
        return await base44.entities.ContentGoal.update(contentGoal.id, goalData);
      } else {
        return await base44.entities.ContentGoal.create({
          week_starting: currentWeekStart,
          ...goalData,
          posts_completed: 0,
          lives_completed: 0,
          shop_lives_completed: 0,
          engagement_completed: 0,
          status: 'in_progress'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentGoal'] });
      queryClient.invalidateQueries({ queryKey: ['allContentGoals'] });
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
      queryClient.invalidateQueries({ queryKey: ['allContentGoals'] });
    },
  });

  const getWeekLabel = () => {
    if (selectedWeekOffset === 0) return 'This Week';
    if (selectedWeekOffset === -1) return 'Last Week';
    if (selectedWeekOffset === 1) return 'Next Week';
    return format(new Date(currentWeekStart), 'MMM d, yyyy');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-purple-600" />
            TikTok Content Goals
          </h1>
          <p className="text-gray-600">Track your content creation journey</p>
        </motion.div>

        {/* Week Navigator */}
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
                className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                ← Previous Week
              </button>
              <div className="text-center">
                <p className="text-sm text-gray-500">Viewing</p>
                <p className="text-xl font-bold text-gray-800">{getWeekLabel()}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(currentWeekStart), 'MMM d')} - {format(addWeeks(new Date(currentWeekStart), 1), 'MMM d')}
                </p>
              </div>
              <button
                onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
                className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                Next Week →
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Current Week Goal */}
        <WeeklyGoalCard
          goal={contentGoal}
          onEdit={() => setShowGoalModal(true)}
          onIncrement={(field) => incrementGoalMutation.mutate(field)}
        />

        {/* Past Weeks History */}
        {allGoals && allGoals.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Past Weeks
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {allGoals.filter(g => g.week_starting !== currentWeekStart).slice(0, 6).map((goal, index) => {
                const totalGoal = goal.posts_goal + goal.lives_goal + goal.shop_lives_goal + goal.engagement_goal;
                const totalCompleted = goal.posts_completed + goal.lives_completed + goal.shop_lives_completed + goal.engagement_completed;
                const percentage = totalGoal > 0 ? Math.round((totalCompleted / totalGoal) * 100) : 0;

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Week of</p>
                            <p className="font-bold text-lg">
                              {format(new Date(goal.week_starting), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className={`text-4xl font-bold ${
                            percentage >= 100 ? 'text-green-600' : percentage >= 75 ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                            {percentage}%
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Posts</p>
                            <p className="font-semibold">{goal.posts_completed}/{goal.posts_goal}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Lives</p>
                            <p className="font-semibold">{goal.lives_completed}/{goal.lives_goal}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Shop Lives</p>
                            <p className="font-semibold">{goal.shop_lives_completed}/{goal.shop_lives_goal}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Engagement</p>
                            <p className="font-semibold">{goal.engagement_completed}/{goal.engagement_goal}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <GoalEditModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        currentGoal={contentGoal}
        onSave={(data) => createOrUpdateGoalMutation.mutate(data)}
      />
    </div>
  );
}