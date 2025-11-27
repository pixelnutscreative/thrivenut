import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ShowerHead, Utensils, Pill, Droplet, Sun, Dumbbell, BookOpen, ExternalLink, GripVertical, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const mealTips = {
  breakfast_completed: '👑 Eat like a king',
  lunch_completed: '🤴 Eat like a prince', 
  dinner_completed: '🥄 Eat like a pauper'
};

export default function SelfCareChecklist({ 
  selfCareLog, 
  onToggleTask, 
  requiredTasks = [],
  showOnlyRequired = false,
  compact = false,
  preferences = {},
  medicationsCount = 0,
  supplementsCount = 0,
  onUpdateOrder = null
}) {
  const [isReordering, setIsReordering] = useState(false);
  const baseTasks = [
    { id: 'shower_completed', label: 'Take a shower', icon: ShowerHead, color: 'text-blue-500' },
    { id: 'breakfast_completed', label: mealTips.breakfast_completed, icon: Utensils, color: 'text-orange-500' },
    { id: 'lunch_completed', label: mealTips.lunch_completed, icon: Utensils, color: 'text-green-500' },
    { id: 'dinner_completed', label: mealTips.dinner_completed, icon: Utensils, color: 'text-purple-500' },
    { id: 'brushed_teeth_morning', label: 'Brush teeth (AM)', icon: Sparkles, color: 'text-cyan-500' },
    { id: 'brushed_teeth_night', label: 'Brush teeth (PM)', icon: Sparkles, color: 'text-indigo-500' },
    { id: 'took_medications', label: 'Take medications', icon: Pill, color: 'text-pink-500', link: 'Medications', count: medicationsCount },
    { id: 'took_supplements', label: 'Take supplements', icon: Pill, color: 'text-amber-500', link: 'Supplements', count: supplementsCount },
    { id: 'drank_water', label: 'Drink water', icon: Droplet, color: 'text-sky-500' },
    { id: 'physical_activity', label: 'Physical activity', icon: Dumbbell, color: 'text-red-500' },
  ];

  // Add Bible reading tasks if user is a believer
  const bibleTasks = preferences?.is_bible_believer ? [
    { id: 'bible_reading_morning', label: 'Morning Bible reading', icon: BookOpen, color: 'text-amber-600' },
    { id: 'bible_reading_night', label: 'Night Bible reading', icon: BookOpen, color: 'text-indigo-600' },
  ] : [];

  const allTasks = [...baseTasks, ...bibleTasks];
  
  // Default order for self-care tasks
  const defaultOrder = [
    'drank_water',
    'bible_reading_morning',
    'physical_activity',
    'shower_completed',
    'breakfast_completed',
    'brushed_teeth_morning',
    'took_medications',
    'took_supplements',
    'lunch_completed',
    'dinner_completed',
    'brushed_teeth_night',
    'bible_reading_night'
  ];

  // Get saved order from preferences or use default
  const savedOrder = preferences?.self_care_order || [];
  
  // Get the order to use (saved or default), filtering to only include available tasks
  const getOrderedTaskIds = () => {
    const orderToUse = savedOrder.length > 0 ? savedOrder : defaultOrder;
    const availableIds = allTasks.map(t => t.id);
    // First add tasks in order, then any remaining tasks not in the order
    const orderedIds = orderToUse.filter(id => availableIds.includes(id));
    const remainingIds = availableIds.filter(id => !orderedIds.includes(id));
    return [...orderedIds, ...remainingIds];
  };

  const [localOrder, setLocalOrder] = useState(getOrderedTaskIds());
  
  useEffect(() => {
    setLocalOrder(getOrderedTaskIds());
  }, [preferences?.self_care_order, preferences?.is_bible_believer]);

  const orderedTasks = localOrder
    .map(id => allTasks.find(t => t.id === id))
    .filter(Boolean);

  const tasksToShow = showOnlyRequired 
    ? orderedTasks.filter(t => requiredTasks.includes(t.id.replace('_completed', '').replace('brushed_teeth_morning', 'brush_teeth').replace('brushed_teeth_night', 'brush_teeth')))
    : orderedTasks;

  const moveTask = (index, direction) => {
    const newOrder = [...localOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setLocalOrder(newOrder);
  };

  const saveOrder = () => {
    if (onUpdateOrder) {
      onUpdateOrder(localOrder);
    }
    setIsReordering(false);
  };

  const completedCount = tasksToShow.filter(t => selfCareLog?.[t.id]).length;
  const totalCount = tasksToShow.length;
  const allComplete = completedCount === totalCount && totalCount > 0;

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Self-Care Progress</span>
          <Badge variant={allComplete ? "default" : "secondary"} className={allComplete ? "bg-green-500" : ""}>
            {completedCount}/{totalCount}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {tasksToShow.map((task) => {
            const Icon = task.icon;
            const isComplete = selfCareLog?.[task.id];
            return (
              <button
                key={task.id}
                onClick={() => onToggleTask(task.id, !isComplete)}
                className={`p-2 rounded-lg border-2 transition-all ${
                  isComplete 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                title={task.label}
              >
                <Icon className={`w-5 h-5 ${isComplete ? 'text-green-500' : 'text-gray-400'}`} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-6 h-6 text-amber-500" />
            Daily Self-Care
          </div>
          <div className="flex items-center gap-2">
            {isReordering ? (
              <Button size="sm" onClick={saveOrder} className="bg-green-500 hover:bg-green-600">
                <Check className="w-4 h-4 mr-1" /> Done
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsReordering(true)}>
                <GripVertical className="w-4 h-4 mr-1" /> Reorder
              </Button>
            )}
            <Badge variant={allComplete ? "default" : "secondary"} className={allComplete ? "bg-green-500" : ""}>
              {completedCount}/{totalCount} Complete
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 bg-green-100 rounded-lg text-center"
          >
            <span className="text-2xl mb-2 block">🎉</span>
            <p className="text-green-800 font-semibold">Amazing! You've taken care of yourself today!</p>
            <p className="text-green-600 text-sm">You're doing great. Keep it up!</p>
          </motion.div>
        )}

        <div className="space-y-3">
          {tasksToShow.map((task, index) => {
            const Icon = task.icon;
            const isComplete = selfCareLog?.[task.id];
            const taskIndex = localOrder.indexOf(task.id);
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                layout={isReordering}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  isComplete 
                    ? 'bg-green-100 border-2 border-green-300' 
                    : 'bg-white border-2 border-gray-100 hover:border-amber-300'
                }`}
              >
                {isReordering && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveTask(taskIndex, 'up')}
                      disabled={taskIndex === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => moveTask(taskIndex, 'down')}
                      disabled={taskIndex === localOrder.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
                <div 
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                  onClick={() => !isReordering && onToggleTask(task.id, !isComplete)}
                >
                  <Checkbox checked={isComplete} className="pointer-events-none" />
                  <Icon className={`w-6 h-6 ${isComplete ? 'text-green-500' : task.color}`} />
                  <div className="flex-1">
                    <span className={`font-medium ${isComplete ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                      {task.label}
                    </span>
                    {task.count > 0 && (
                      <span className="ml-2 text-xs text-gray-500">({task.count} items)</span>
                    )}
                  </div>
                </div>
                
                {task.link && !isReordering && (
                  <Link 
                    to={createPageUrl(task.link)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={`Go to ${task.link}`}
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </Link>
                )}
                
                {isComplete && !task.link && !isReordering && <span className="text-green-500">✓</span>}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}