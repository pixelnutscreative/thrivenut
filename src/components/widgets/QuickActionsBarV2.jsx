import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Zap, Droplet, Smile, Utensils, Lightbulb, Cloud, StickyNote, Heart,
  Plus, Check, ExternalLink, Home, Music, Link, Calendar, 
  Settings as SettingsIcon, GripVertical
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useTheme } from '../shared/useTheme';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MoodDialog from '../quick-actions/MoodDialog';
import FoodDialog from '../quick-actions/FoodDialog';
import NoteDialog from '../quick-actions/NoteDialog';
import IdeaDialog from '../quick-actions/IdeaDialog';
import GratitudeDialog from '../quick-actions/GratitudeDialog';
import TaskDialog from '../quick-actions/TaskDialog';
import EventDialog from '../quick-actions/EventDialog';
import { format } from 'date-fns';

// Map icon names to Lucide components
const iconMap = {
  Smile, Droplet, Utensils, Lightbulb, Cloud, StickyNote, Heart,
  Plus, Check, ExternalLink, Home, Music, Link, Calendar,
  Settings: SettingsIcon, Zap, GripVertical
};

const REFRAME_ACTION = { id: 'reframe', label: 'Reframe', icon: 'Cloud', color: '#10B981' };

const baseBuiltInActions = [
  { id: 'mood', label: 'Mood', icon: 'Smile', color: '#EC4899' },
  { id: 'water', label: 'Water', icon: 'Droplet', color: '#06B6D4' },
  { id: 'food', label: 'Food', icon: 'Utensils', color: '#F97316' },
  { id: 'note', label: 'Note', icon: 'StickyNote', color: '#EAB308' },
  { id: 'idea', label: 'Idea', icon: 'Lightbulb', color: '#A855F7' },
  { id: 'gratitude', label: 'Gratitude', icon: 'Heart', color: '#EF4444' },
  { id: 'reframe', label: 'Reframe', icon: 'Cloud', color: '#10B981' },
  { id: 'task', label: 'Task', icon: 'Check', color: '#3B82F6' },
  { id: 'event', label: 'Add Event', icon: 'Calendar', color: '#F59E0B' },
];

export default function QuickActionsBarV2({
  preferences, 
  primaryColor,
  accentColor
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useTheme();

  const [openModal, setOpenModal] = useState(null);

  const actionsToDisplay = useMemo(() => {
    if (!preferences || !preferences.quick_actions) return baseBuiltInActions.map(a => ({...a, Icon: iconMap[a.icon]}));

    const allActions = [];

    preferences.quick_actions.forEach(actionId => {
      const builtIn = baseBuiltInActions.find(b => b.id === actionId);
      const custom = preferences.custom_quick_actions?.find(c => c.id === actionId);
      const overrides = preferences.action_overrides?.[actionId];

      if (custom) {
        allActions.push({
          ...custom,
          Icon: iconMap[custom.icon] || Zap,
          color: custom.color || '#6B7280',
        });
      } else if (builtIn) {
        allActions.push({
          ...builtIn,
          Icon: iconMap[builtIn.icon] || Zap,
          label: overrides?.label || builtIn.label,
          color: overrides?.color || builtIn.color,
        });
      }
    });
    return allActions;
  }, [preferences]);

  // Mutations
  // Fetch today's water log for immediate display
  const { data: waterLog } = useQuery({
    queryKey: ['waterLogToday', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const logs = await base44.entities.WaterLog.filter({ date: todayStr, created_by: user.email });
      return logs[0] || { glasses: 0 };
    },
    enabled: !!user?.email
  });

  // Fetch today's mood for icon display
  const { data: moodLog } = useQuery({
    queryKey: ['moodLogToday', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const logs = await base44.entities.MoodLog.filter({ date: todayStr, created_by: user.email }, '-timestamp');
      return logs[0] || null;
    },
    enabled: !!user?.email
  });

  const logWaterMutation = useMutation({
    mutationFn: async () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      // Optimistic update logic handled by UI, actual DB update:
      const existingLog = await base44.entities.WaterLog.filter({ date: todayStr, created_by: user.email });
      if (existingLog.length > 0) {
        const currentGlasses = existingLog[0].glasses;
        return base44.entities.WaterLog.update(existingLog[0].id, { glasses: currentGlasses + 1 });
      } else {
        return base44.entities.WaterLog.create({ date: todayStr, glasses: 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterLogToday'] });
      queryClient.invalidateQueries({ queryKey: ['waterLogs'] });
      queryClient.invalidateQueries({ queryKey: ['dailySelfCareLog'] });
    },
  });

  const logMoodMutation = useMutation({
    mutationFn: (data) => base44.entities.MoodLog.create({ ...data, date: format(new Date(), 'yyyy-MM-dd'), timestamp: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moodLogs'] });
      queryClient.invalidateQueries({ queryKey: ['moodLogToday'] });
    }
  });

  const logFoodMutation = useMutation({
    mutationFn: (data) => base44.entities.FoodLog.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['foodLogs'] }),
  });

  const logNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.QuickNote.create({ ...data, created_date: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quickNotes'] }),
  });

  const logIdeaMutation = useMutation({
    mutationFn: (data) => base44.entities.QuickNote.create({ ...data, created_date: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contentIdeas'] }),
  });

  const logGratitudeMutation = useMutation({
    mutationFn: (data) => base44.entities.GratitudeLog.create({ ...data, date: format(new Date(), 'yyyy-MM-dd') }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gratitudeLogs'] }),
  });

  const logTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create({ ...data, created_date: new Date().toISOString(), status: 'pending' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const logEventMutation = useMutation({
    mutationFn: (data) => base44.entities.ExternalEvent.create({ ...data, created_date: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['externalEvents'] }),
  });

  const handleActionClick = (action) => {
    if (action.id === 'water') logWaterMutation.mutate();
    else if (action.id === 'mood') setOpenModal('mood');
    else if (action.id === 'food') setOpenModal('food');
    else if (action.id === 'note') setOpenModal('note');
    else if (action.id === 'idea') setOpenModal('idea');
    else if (action.id === 'gratitude') setOpenModal('gratitude');
    else if (action.id === 'task') setOpenModal('task');
    else if (action.id === 'event') setOpenModal('event');
    else if (action.id === 'reframe') alert('AI Reframe coming soon!');
    else if (action.page) navigate(createPageUrl(action.page));
    else if (action.external_url) window.open(action.external_url, '_blank');
  };

  const barBg = preferences?.quick_actions_bar_color || 'rgba(255, 255, 255, 0.9)';
  const iconSize = preferences?.quick_actions_icon_size || 'medium';
  const barHeight = preferences?.quick_actions_bar_height || 'standard';

  // Define size classes
  const sizeClasses = {
    small: { container: 'w-8 h-8', icon: 'w-4 h-4' },
    medium: { container: 'w-12 h-12', icon: 'w-6 h-6' },
    large: { container: 'w-16 h-16', icon: 'w-8 h-8' },
    xl: { container: 'w-20 h-20', icon: 'w-10 h-10' }
  };

  const currentSize = sizeClasses[iconSize] || sizeClasses.medium;

  // Define padding classes based on height setting
  const paddingClass = {
    compact: 'py-2',
    standard: 'py-4',
    tall: 'py-6'
  }[barHeight] || 'py-4';

  return (
    <motion.div 
      initial={{ y: -100 }} 
      animate={{ y: 0 }}
      className="fixed top-14 left-0 right-0 z-40 lg:top-0 lg:left-72"
    >
      <div 
        className={`w-full px-4 ${paddingClass} backdrop-blur-md border-t shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex justify-between items-center`}
        style={{ backgroundColor: barBg }}
      >
        <div className="flex-1 flex justify-center gap-4 sm:gap-8 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          {actionsToDisplay.map((action, index) => {
            const IconComponent = action.Icon;
            // Handle tailwind classes vs hex codes
            const isTailwind = action.color?.startsWith('bg-');
            const style = isTailwind ? {} : { backgroundColor: action.color };
            const className = isTailwind ? action.color : '';

            // Custom display for Water (counter) and Mood (emoji)
            let displayContent = <IconComponent className={currentSize.icon} />;
            
            if (action.id === 'water' && waterLog?.glasses > 0) {
              displayContent = (
                <div className="relative w-full h-full flex items-center justify-center">
                  <IconComponent className={currentSize.icon} />
                  <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white">
                    {waterLog.glasses}
                  </div>
                </div>
              );
            }

            if (action.id === 'mood' && moodLog?.mood) {
              const emojiMap = {
                amazing: '🤩', good: '😊', okay: '😐', low: '😔', struggling: '😢',
                great: '😄', anxious: '😰', angry: '😡', sad: '😢', loved: '🥰', motivated: '💪', tired: '😴'
              };
              // Check user custom moods too
              const customEmoji = preferences?.custom_mood_options?.find(m => m.value === moodLog.mood)?.emoji;
              const emoji = customEmoji || emojiMap[moodLog.mood] || '😐';
              
              displayContent = <span className="text-xl">{emoji}</span>;
            }

            return (
              <div key={action.id || index} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => handleActionClick(action)}>
                <div 
                  className={`${currentSize.container} rounded-full flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 group-active:scale-95 ${className}`}
                  style={style}
                >
                  {displayContent}
                </div>
                {!preferences?.hide_quick_action_labels && (
                  <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-800">{action.label}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Settings Gear */}
        <div className="pl-4 border-l border-gray-200 ml-4 flex flex-col items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/Settings#widgets-v2')}
            className="rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <SettingsIcon className="w-5 h-5" />
          </Button>
          <span className="text-[10px] text-gray-400 mt-1">Config</span>
        </div>
      </div>

      {/* Modals */}
      <MoodDialog isOpen={openModal === 'mood'} onClose={() => setOpenModal(null)} onSave={logMoodMutation.mutate} isLoading={logMoodMutation.isPending} topMoodEmojis={preferences?.custom_mood_options || []} />
      <FoodDialog isOpen={openModal === 'food'} onClose={() => setOpenModal(null)} onSave={logFoodMutation.mutate} isLoading={logFoodMutation.isPending} />
      <NoteDialog isOpen={openModal === 'note'} onClose={() => setOpenModal(null)} onSave={logNoteMutation.mutate} isLoading={logNoteMutation.isPending} />
      <IdeaDialog isOpen={openModal === 'idea'} onClose={() => setOpenModal(null)} onSave={logIdeaMutation.mutate} isLoading={logIdeaMutation.isPending} />
      <GratitudeDialog isOpen={openModal === 'gratitude'} onClose={() => setOpenModal(null)} onSave={logGratitudeMutation.mutate} isLoading={logGratitudeMutation.isPending} />
      <TaskDialog isOpen={openModal === 'task'} onClose={() => setOpenModal(null)} onSave={logTaskMutation.mutate} isLoading={logTaskMutation.isPending} />
      <EventDialog isOpen={openModal === 'event'} onClose={() => setOpenModal(null)} onSave={logEventMutation.mutate} isLoading={logEventMutation.isPending} />
    </motion.div>
  );
}