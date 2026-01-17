import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Target, ExternalLink, ChevronRight, TrendingUp, Award, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format } from 'date-fns';

export default function DashboardGoalsSection({ userEmail }) {
  const [selectedGoal, setSelectedGoal] = useState(null);

  const { data: goals = [] } = useQuery({
    queryKey: ['activeGoals', userEmail],
    queryFn: () => base44.entities.Goal.filter({ status: 'active', created_by: userEmail }),
    enabled: !!userEmail,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });

  if (goals.length === 0) return null;

  return (
    <>
      <Card className="shadow-sm border border-gray-100 bg-white">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              Goals Progress
            </CardTitle>
            <Link to={createPageUrl('Goals')}>
              <Button variant="ghost" size="sm" className="h-8 text-gray-400 hover:text-gray-600">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-4">
            {goals.slice(0, 3).map((goal) => {
              const progress = goal.target_value && goal.current_value
                ? Math.round((goal.current_value / goal.target_value) * 100)
                : 0;

              return (
                <div key={goal.id} className="space-y-1 cursor-pointer" onClick={() => setSelectedGoal(goal)}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800 text-sm">{goal.title}</span>
                    <span className="text-gray-400 text-sm">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Goal Detail Modal */}
      <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              {selectedGoal?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700">
                  {selectedGoal.category}
                </Badge>
                <Badge variant="outline">
                  {selectedGoal.goal_type}
                </Badge>
              </div>

              {selectedGoal.description && (
                <p className="text-sm text-gray-600">{selectedGoal.description}</p>
              )}

              {selectedGoal.target_value && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-purple-700">
                      {selectedGoal.current_value || 0} / {selectedGoal.target_value} {selectedGoal.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${Math.min(100, Math.round(((selectedGoal.current_value || 0) / selectedGoal.target_value) * 100))}%` 
                      }}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                    />
                  </div>
                </div>
              )}

              {selectedGoal.target_date && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  Target: {format(new Date(selectedGoal.target_date), 'MMM d, yyyy')}
                </div>
              )}

              <Link to={createPageUrl('Goals')}>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Edit Goal Details
                </Button>
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}