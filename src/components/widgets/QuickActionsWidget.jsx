import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Zap, Droplet, Smile, Utensils, Lightbulb, Cloud, StickyNote, 
  X, Check, Plus, Settings, ChevronUp, Music, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { getEffectiveUserEmail } from '../admin/ImpersonationBanner';

const actionTypes = [
  { id: 'mood', label: 'Mood', icon: Smile, color: 'bg-pink-500' },
  { id: 'water', label: 'Water', icon: Droplet, color: 'bg-blue-500' },
  { id: 'food', label: 'Food', icon: Utensils, color: 'bg-orange-500' },
  { id: 'idea', label: 'Idea', icon: Lightbulb, color: 'bg-yellow-500' },
  { id: 'negative_thought', label: 'Reframe', icon: Cloud, color: 'bg-purple-500' },
  { id: 'note', label: 'Note', icon: StickyNote, color: 'bg-green-500' },
  { id: 'gratitude', label: 'Gratitude', icon: Heart, color: 'bg-red-500' },
];

const moodOptions = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'low', emoji: '😔', label: 'Low' },
  { value: 'anxious', emoji: '😰', label: 'Anxious' },
];

export default function QuickActionsWidget({ preferences, primaryColor, accentColor }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const userEmail = preferences?.user_email;
  const quickActions = preferences?.quick_actions || ['mood', 'water', 'food', 'note'];

  // Mutations
  const waterLogMutation = useMutation({
    mutationFn: async () => {
      const existing = await base44.entities.WaterLog.filter({ date: today, created_by: userEmail });
      if (existing[0]) {
        return base44.entities.WaterLog.update(existing[0].id, { 
          glasses: (existing[0].glasses || 0) + 1 
        });
      }
      return base44.entities.WaterLog.create({ date: today, glasses: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterLog'] });
      setActiveAction(null);
    }
  });

  const moodLogMutation = useMutation({
    mutationFn: async (mood) => {
      return base44.entities.MoodLog.create({ 
        date: today, 
        mood,
        time: format(new Date(), 'HH:mm')
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moodLog'] });
      setActiveAction(null);
      setSelectedMood(null);
    }
  });

  const quickNoteMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.QuickNote.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickNotes'] });
      setActiveAction(null);
      setNoteContent('');
    }
  });

  const handleAction = (actionId) => {
    if (actionId === 'water') {
      waterLogMutation.mutate();
    } else {
      setActiveAction(actionId);
    }
  };

  const handleSubmitNote = () => {
    if (!noteContent.trim()) return;
    quickNoteMutation.mutate({
      type: activeAction,
      content: noteContent
    });
  };

  const handleMoodSelect = (mood) => {
    moodLogMutation.mutate(mood);
  };

  const visibleActions = actionTypes.filter(a => quickActions.includes(a.id));

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white"
        style={{ background: `linear-gradient(135deg, ${primaryColor || '#1fd2ea'}, ${accentColor || '#bd84f5'})` }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Zap className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Quick Actions Menu */}
      <AnimatePresence>
        {isOpen && !activeAction && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl p-4 min-w-[200px]"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Quick Actions</h3>
              <button
                onClick={() => setShowSettings(true)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Settings className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {visibleActions.map((action) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl ${action.color} text-white hover:opacity-90 transition-opacity`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood Selector */}
      <AnimatePresence>
        {isOpen && activeAction === 'mood' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">How are you feeling?</h3>
              <button onClick={() => setActiveAction(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => handleMoodSelect(mood.value)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs text-gray-600">{mood.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note Input */}
      <AnimatePresence>
        {isOpen && ['food', 'idea', 'negative_thought', 'note', 'gratitude'].includes(activeAction) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl p-4 w-72"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">
                {activeAction === 'food' && '🍽️ Log Food'}
                {activeAction === 'idea' && '💡 Capture Idea'}
                {activeAction === 'negative_thought' && '☁️ Reframe Thought'}
                {activeAction === 'note' && '📝 Quick Note'}
                {activeAction === 'gratitude' && '❤️ Gratitude'}
              </h3>
              <button onClick={() => setActiveAction(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={
                activeAction === 'food' ? 'What did you eat?' :
                activeAction === 'idea' ? 'What\'s your idea?' :
                activeAction === 'negative_thought' ? 'What negative thought are you having?' :
                activeAction === 'gratitude' ? 'What are you grateful for?' :
                'Write a quick note...'
              }
              className="min-h-[80px] mb-3"
              autoFocus
            />
            <Button
              onClick={handleSubmitNote}
              disabled={!noteContent.trim() || quickNoteMutation.isPending}
              className="w-full"
              style={{ background: `linear-gradient(to right, ${primaryColor || '#1fd2ea'}, ${accentColor || '#bd84f5'})` }}
            >
              <Check className="w-4 h-4 mr-2" />
              Save
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize Quick Actions</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 mb-4">
            Choose which quick actions appear in your floating widget
          </p>
          <div className="space-y-2">
            {actionTypes.map((action) => {
              const Icon = action.icon;
              const isEnabled = quickActions.includes(action.id);
              return (
                <div
                  key={action.id}
                  onClick={async () => {
                    const newActions = isEnabled 
                      ? quickActions.filter(a => a !== action.id)
                      : [...quickActions, action.id];
                    if (preferences?.id) {
                      await base44.entities.UserPreferences.update(preferences.id, { quick_actions: newActions });
                      queryClient.invalidateQueries({ queryKey: ['preferences'] });
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    isEnabled ? 'bg-purple-50 border-2 border-purple-300' : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">{action.label}</span>
                  {isEnabled && <Check className="w-4 h-4 text-purple-500 ml-auto" />}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}