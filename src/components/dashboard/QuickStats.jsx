import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Droplet, Heart, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuickStats({ contentGoal, waterToday, todaysMood, journalToday }) {
  const stats = [
    {
      icon: TrendingUp,
      label: 'Content This Week',
      value: contentGoal ? `${contentGoal.posts_completed + contentGoal.lives_completed + contentGoal.shop_lives_completed}/${contentGoal.posts_goal + contentGoal.lives_goal + contentGoal.shop_lives_goal}` : '0/0',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Droplet,
      label: 'Water Today',
      value: waterToday ? `${waterToday.glasses}/${waterToday.goal_glasses}` : '0/8',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Heart,
      label: 'Mood',
      value: todaysMood || 'Not logged',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50'
    },
    {
      icon: BookOpen,
      label: 'Journal',
      value: journalToday ? '✓ Logged' : 'Not yet',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`${stat.bgColor} border-0 shadow-md hover:shadow-lg transition-shadow`}>
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}