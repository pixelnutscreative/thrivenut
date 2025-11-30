import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Zap, Droplet, Smile, Utensils, Lightbulb, Cloud, StickyNote, 
  X, Check, Settings, Music, Heart, Home, Link, ExternalLink, Lock, Unlock, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const builtInActions = [
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

const iconMap = { Smile, Droplet, Utensils, Lightbulb, Cloud, StickyNote, Heart, Home, Music, Zap, Link, ExternalLink };

export default function QuickActionsWidget({ preferences, primaryColor, accentColor }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const userEmail = preferences?.user_email;
  const quickActions = preferences?.quick_actions || ['mood', 'water', 'food', 'note'];
  const customActions = preferences?.custom_quick_actions || [];
  const position = preferences?.quick_actions_position || 'bottom';

  // Load locked state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('quickActionsLocked');
    if (saved === 'true') {
      setIsLocked(true);
      setIsOpen(true);
    }
  }, []);

  const handleLockToggle = () => {
    const newLocked = !isLocked;
    setIsLocked(newLocked);
    localStorage.setItem('quickActionsLocked', newLocked.toString());
    if (newLocked) {
      setIsOpen(true);
    }
  };

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

  // Get all visible actions (built-in + custom) - limit to 7
  const getVisibleActions = () => {
    const actions = [];
    quickActions.slice(0, 7).forEach(id => {
      const builtIn = builtInActions.find(a => a.id === id);
      if (builtIn) {
        actions.push(builtIn);
      } else {
        const custom = customActions.find(a => a.id === id);
        if (custom) {
          actions.push({
            ...custom,
            icon: iconMap[custom.icon] || Zap,
            isCustom: true
          });
        }
      }
    });
    return actions;
  };

  const visibleActions = getVisibleActions();

  // Position-based styles for the bar
  const getBarPosition = () => {
    switch (position) {
      case 'top':
        return 'top-4 left-1/2 -translate-x-1/2 flex-row';
      case 'left':
        return 'left-4 top-1/2 -translate-y-1/2 flex-col';
      case 'right':
        return 'right-4 top-1/2 -translate-y-1/2 flex-col';
      case 'bottom':
      default:
        return 'bottom-4 left-1/2 -translate-x-1/2 flex-row';
    }
  };

  const getBarAnimation = () => {
    switch (position) {
      case 'top':
        return { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } };
      case 'left':
        return { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };
      case 'right':
        return { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 } };
      case 'bottom':
      default:
        return { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 20 } };
    }
  };

  const isVertical = position === 'left' || position === 'right';
  const barPos = getBarPosition();
  const barAnim = getBarAnimation();

  // Get popup position based on bar position
  const getPopupPosition = () => {
    switch (position) {
      case 'top':
        return 'top-20 left-1/2 -translate-x-1/2';
      case 'left':
        return 'left-20 top-1/2 -translate-y-1/2';
      case 'right':
        return 'right-20 top-1/2 -translate-y-1/2';
      case 'bottom':
      default:
        return 'bottom-20 left-1/2 -translate-x-1/2';
    }
  };

  const popupPos = getPopupPosition();

  return (
    <>
      {/* Collapsed toggle button when not open and not locked */}
      <AnimatePresence>
        {!isOpen && !isLocked && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsOpen(true)}
            className={`fixed z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white ${
              position === 'top' ? 'top-4 right-4' :
              position === 'left' ? 'bottom-4 left-4' :
              position === 'right' ? 'bottom-4 right-4' :
              'bottom-4 right-4'
            }`}
            style={{ background: `linear-gradient(135deg, ${primaryColor || '#1fd2ea'}, ${accentColor || '#bd84f5'})` }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Quick Actions Bar */}
      <AnimatePresence>
        {isOpen && !activeAction && (
          <motion.div
            {...barAnim}
            className={`fixed ${barPos} z-50 flex gap-2 items-center bg-gray-900/90 backdrop-blur-sm rounded-2xl p-2 shadow-2xl`}
          >
            {/* Control buttons */}
            <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} gap-1`}>
              <button
                onClick={handleLockToggle}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title={isLocked ? "Unlock drawer" : "Lock drawer open"}
              >
                {isLocked ? (
                  <Lock className="w-4 h-4 text-amber-400" />
                ) : (
                  <Unlock className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {!isLocked && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Divider */}
            <div className={`${isVertical ? 'w-full h-px' : 'h-8 w-px'} bg-gray-600`} />

            {/* Action buttons */}
            {visibleActions.map((action) => {
              const Icon = action.icon;
              
              // Handle custom actions with page/external links
              if (action.isCustom) {
                if (action.external_url) {
                  return (
                    <a
                      key={action.id}
                      href={action.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center text-white hover:opacity-90 transition-all hover:scale-110`}
                      title={action.label}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                }
                if (action.page) {
                  return (
                    <RouterLink
                      key={action.id}
                      to={createPageUrl(action.page)}
                      className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center text-white hover:opacity-90 transition-all hover:scale-110`}
                      title={action.label}
                    >
                      <Icon className="w-5 h-5" />
                    </RouterLink>
                  );
                }
              }

              return (
                <motion.button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center text-white hover:opacity-90 transition-all`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title={action.label}
                >
                  <Icon className="w-5 h-5" />
                </motion.button>
              );
            })}

            {/* Divider */}
            <div className={`${isVertical ? 'w-full h-px' : 'h-8 w-px'} bg-gray-600`} />

            {/* View notes & Settings */}
            <RouterLink
              to={createPageUrl('QuickNotes')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="View saved notes"
            >
              <BookOpen className="w-4 h-4 text-gray-400 hover:text-white" />
            </RouterLink>
            <RouterLink
              to={createPageUrl('Settings') + '?tab=widgets'}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-gray-400 hover:text-white" />
            </RouterLink>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood Selector Popup */}
      <AnimatePresence>
        {isOpen && activeAction === 'mood' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed ${popupPos} z-50 bg-white rounded-2xl shadow-2xl p-4`}
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

      {/* Note Input Popup */}
      <AnimatePresence>
        {isOpen && ['food', 'idea', 'negative_thought', 'note', 'gratitude'].includes(activeAction) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed ${popupPos} z-50 bg-white rounded-2xl shadow-2xl p-4 w-80`}
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
    </>
  );
}