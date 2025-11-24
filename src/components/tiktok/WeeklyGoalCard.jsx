import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, Video, ShoppingBag, MessageCircle, Edit } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WeeklyGoalCard({ goal, onEdit, onIncrement }) {
  if (!goal) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600 mb-4">No goals set for this week yet</p>
          <Button onClick={onEdit} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Set This Week's Goals
          </Button>
        </CardContent>
      </Card>
    );
  }

  const goalItems = [
    {
      icon: Video,
      label: 'Posts',
      completed: goal.posts_completed,
      total: goal.posts_goal,
      key: 'posts',
      color: 'text-purple-600'
    },
    {
      icon: Video,
      label: 'Lives',
      completed: goal.lives_completed,
      total: goal.lives_goal,
      key: 'lives',
      color: 'text-pink-600'
    },
    {
      icon: ShoppingBag,
      label: 'Shop Lives',
      completed: goal.shop_lives_completed,
      total: goal.shop_lives_goal,
      key: 'shop_lives',
      color: 'text-orange-600'
    },
    {
      icon: MessageCircle,
      label: 'Engagement',
      completed: goal.engagement_completed,
      total: goal.engagement_goal,
      key: 'engagement',
      color: 'text-blue-600'
    }
  ];

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">This Week's Content Goals</CardTitle>
        <Button onClick={onEdit} variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {goalItems.map((item, index) => {
          const Icon = item.icon;
          const percentage = item.total > 0 ? (item.completed / item.total) * 100 : 0;
          
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    {item.completed}/{item.total}
                  </span>
                  {item.completed < item.total && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => onIncrement(item.key)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
            </motion.div>
          );
        })}

        {goal.notes && (
          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">Weekly Notes:</p>
            <p className="text-sm text-gray-600">{goal.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}