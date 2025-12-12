import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Target, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function CompactGoalsScroll({ userEmail }) {
  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery({
    queryKey: ['activeGoals', userEmail],
    queryFn: () => base44.entities.Goal.filter({ status: 'active', created_by: userEmail }),
    enabled: !!userEmail,
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (goalId) => {
      await base44.entities.Goal.update(goalId, { status: 'completed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGoals'] });
    },
  });

  if (goals.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto pb-2 -mx-2 px-2">
      <div className="flex gap-2 min-w-max">
        {goals.map((goal) => {
          const progress = goal.target_value && goal.current_value
            ? Math.round((goal.current_value / goal.target_value) * 100)
            : 0;

          const isComplete = progress >= 100;

          return (
            <motion.div
              key={goal.id}
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0"
            >
              <Link
                to={createPageUrl('Goals')}
                className="flex flex-col items-center gap-1 p-2 bg-white/80 rounded-lg border border-white/40 hover:bg-white transition-all shadow-sm min-w-[70px] max-w-[80px] relative"
              >
                {/* Complete checkbox */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isComplete) {
                      markCompleteMutation.mutate(goal.id);
                    }
                  }}
                  className="absolute -top-1 -right-1 bg-white rounded-full shadow-sm hover:scale-110 transition-transform z-10"
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300 hover:text-gray-400" />
                  )}
                </button>

                {/* Icon/Emoji */}
                <div className="relative">
                  {goal.emoji ? (
                    <div className="relative">
                      <Target className="w-6 h-6 text-purple-600 opacity-20" />
                      <span className="absolute inset-0 flex items-center justify-center text-lg">
                        {goal.emoji}
                      </span>
                    </div>
                  ) : (
                    <Target className="w-6 h-6 text-purple-600" />
                  )}
                </div>

                {/* Goal name */}
                <span className="text-[10px] font-medium text-gray-700 text-center line-clamp-2 leading-tight">
                  {goal.title}
                </span>

                {/* Progress indicator */}
                {goal.target_value > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-0.5">
                    <div 
                      className="bg-purple-500 h-1 rounded-full transition-all"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}