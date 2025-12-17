import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { 
  Zap, Droplet, Smile, Utensils, Lightbulb, Cloud, StickyNote, Heart,
  Plus, Check, ExternalLink, Home, Music, Link, Calendar as CalendarIcon, 
  Settings as SettingsIcon, 
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
  Smile: Smile,
  Droplet: Droplet,
  Utensils: Utensils,
  Lightbulb: Lightbulb,
  Cloud: Cloud,
  StickyNote: StickyNote,
  Heart: Heart,
  Plus: Plus,
  Check: Check,
  ExternalLink: ExternalLink,
  Home: Home,
  Music: Music,
  Link: Link,
  Calendar: CalendarIcon,
  Settings: SettingsIcon,
};

// Reframe action is a placeholder for future AI-powered features
const REFRAME_ACTION = { id: 'reframe', label: 'Reframe', icon: 'Cloud', color: 'bg-purple-500' };

// Base built-in actions (some have default modals)
const baseBuiltInActions = [
  { id: 'mood', label: 'Mood', icon: 'Smile', color: 'bg-pink-500' },
  { id: 'water', label: 'Water', icon: 'Droplet', color: 'bg-blue-500' },
  { id: 'food', label: 'Food', icon: 'Utensils', color: 'bg-green-500' },
  { id: 'note', label: 'Note', icon: 'StickyNote', color: 'bg-lime-500' },
  { id: 'idea', label: 'Idea', icon: 'Lightbulb', color: 'bg-yellow-500' },
  { id: 'gratitude', label: 'Gratitude', icon: 'Heart', color: 'bg-red-500' },
  { id: 'task', label: 'Quick Task', icon: 'Check', color: 'bg-teal-500' },
  { id: 'event', label: 'Add Event', icon: 'Calendar', color: 'bg-orange-500' },
  REFRAME_ACTION,
];

export default function QuickActionsBarV2({
  preferences, 
  primaryColor,
  accentColor
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useTheme();

  const [openModal, setOpenModal] = useState(null); // 'mood', 'food', 'note', etc.

  // Combine built-in, custom, and override preferences
  const actionsToDisplay = useMemo(() => {
    if (!preferences || !preferences.quick_actions) return [];

    const allActions = [];

    preferences.quick_actions.forEach(actionId => {
      const builtIn = baseBuiltInActions.find(b => b.id === actionId);
      const custom = preferences.custom_quick_actions?.find(c => c.id === actionId);
      const overrides = preferences.action_overrides?.[actionId];

      if (custom) {
        allActions.push({
          ...custom,
          Icon: iconMap[custom.icon],
          color: custom.color || 'bg-gray-500', // Ensure a fallback color
        });
      } else if (builtIn) {
        allActions.push({
          ...builtIn,
          Icon: iconMap[builtIn.icon],
          label: overrides?.label || builtIn.label,
          color: overrides?.color || builtIn.color,
        });
      }
    });
    return allActions;
  }, [preferences]);

  // Water Log Mutation
  const logWaterMutation = useMutation({
    mutationFn: async () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const existingLog = await base44.entities.WaterLog.filter({ date: todayStr, created_by: user.email });
      if (existingLog.length > 0) {
        const currentGlasses = existingLog[0].glasses;
        return base44.entities.WaterLog.update(existingLog[0].id, { glasses: currentGlasses + 1 });
      } else {
        return base44.entities.WaterLog.create({ date: todayStr, glasses: 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterLogs'] });
      queryClient.invalidateQueries({ queryKey: ['dailySelfCareLog'] }); // If dashboard uses this
    },
  });

  // Mood Log Mutation
  const logMoodMutation = useMutation({
    mutationFn: (data) => base44.entities.MoodLog.create({ ...data, date: format(new Date(), 'yyyy-MM-dd'), timestamp: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moodLogs'] }),
  });

  // Food Log Mutation
  const logFoodMutation = useMutation({
    mutationFn: (data) => base44.entities.FoodLog.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['foodLogs'] }),
  });

  // Note Log Mutation
  const logNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.QuickNote.create({ ...data, created_date: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quickNotes'] }),
  });

  // Idea Log Mutation (using QuickNote for now as ContentIdea is not explicit entity)
  const logIdeaMutation = useMutation({
    mutationFn: (data) => base44.entities.QuickNote.create({ ...data, created_date: new Date().toISOString() }), // Assuming ContentIdea is a QuickNote with a specific intent, or similar
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contentIdeas'] }),
  });

  // Gratitude Log Mutation
  const logGratitudeMutation = useMutation({
    mutationFn: (data) => base44.entities.GratitudeLog.create({ ...data, date: format(new Date(), 'yyyy-MM-dd') }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gratitudeLogs'] }),
  });

  // Task Log Mutation
  const logTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create({ ...data, created_date: new Date().toISOString(), status: 'pending' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  // Event Log Mutation (using ExternalEvent for now)
  const logEventMutation = useMutation({
    mutationFn: (data) => base44.entities.ExternalEvent.create({ ...data, created_date: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['externalEvents'] }),
  });

  const handleActionClick = (action) => {
    if (action.id === 'water') {
      logWaterMutation.mutate();
    } else if (action.id === 'mood') {
      setOpenModal('mood');
    } else if (action.id === 'food') {
      setOpenModal('food');
    } else if (action.id === 'note') {
      setOpenModal('note');
    } else if (action.id === 'idea') {
      setOpenModal('idea');
    } else if (action.id === 'gratitude') {
      setOpenModal('gratitude');
    } else if (action.id === 'task') {
      setOpenModal('task');
    } else if (action.id === 'event') {
      setOpenModal('event');
    } else if (action.id === 'reframe') {
      // Placeholder for AI reframe
      alert('AI Reframe coming soon!');
    } else if (action.page) {
      navigate(createPageUrl(action.page));
    } else if (action.external_url) {
      window.open(action.external_url, '_blank');
    }
  };

  const quickActionsBarColor = preferences?.quick_actions_bar_color || 'rgba(75, 85, 99, 0.95)'; // default gray-700

  return (
    <motion.div 
      initial={{ y: 100 }} 
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-gray-700 backdrop-blur-sm bg-opacity-95 shadow-lg lg:left-72"
      style={{ backgroundColor: quickActionsBarColor }}
    >
      <div className="max-w-4xl mx-auto flex justify-around items-center gap-2">
        {actionsToDisplay.map((action, index) => {
          const IconComponent = action.Icon;
          return (
            <Button
              key={action.id || index}
              onClick={() => handleActionClick(action)}
              className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg text-white shadow-none hover:shadow-md transition-all`}
              style={{ backgroundColor: action.color || primaryColor }}
            >
              {IconComponent && <IconComponent className="w-5 h-5 mb-1" />}
              <span className="text-xs font-medium leading-none">{action.label}</span>
            </Button>
          );
        })}
      </div>

      <MoodDialog 
        isOpen={openModal === 'mood'} 
        onClose={() => setOpenModal(null)} 
        onSave={logMoodMutation.mutate}
        isLoading={logMoodMutation.isPending}
        topMoodEmojis={preferences?.custom_mood_options || []}
      />
      <FoodDialog 
        isOpen={openModal === 'food'} 
        onClose={() => setOpenModal(null)} 
        onSave={logFoodMutation.mutate}
        isLoading={logFoodMutation.isPending}
      />
      <NoteDialog 
        isOpen={openModal === 'note'} 
        onClose={() => setOpenModal(null)} 
        onSave={logNoteMutation.mutate}
        isLoading={logNoteMutation.isPending}
      />
      <IdeaDialog 
        isOpen={openModal === 'idea'} 
        onClose={() => setOpenModal(null)} 
        onSave={logIdeaMutation.mutate}
        isLoading={logIdeaMutation.isPending}
      />
      <GratitudeDialog 
        isOpen={openModal === 'gratitude'} 
        onClose={() => setOpenModal(null)} 
        onSave={logGratitudeMutation.mutate}
        isLoading={logGratitudeMutation.isPending}
      />
      <TaskDialog 
        isOpen={openModal === 'task'} 
        onClose={() => setOpenModal(null)} 
        onSave={logTaskMutation.mutate}
        isLoading={logTaskMutation.isPending}
      />
      <EventDialog 
        isOpen={openModal === 'event'} 
        onClose={() => setOpenModal(null)} 
        onSave={logEventMutation.mutate}
        isLoading={logEventMutation.isPending}
      />
    </motion.div>
  );
}