import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Zap, Droplet, Smile, Utensils, Lightbulb, Cloud, StickyNote, 
  X, Check, Settings, Music, Heart, Home, Link, ExternalLink, GripHorizontal, BookOpen
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
  const [isOpen, setIsOpen] = useState(true);
  const [activeAction, setActiveAction] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const userEmail = preferences?.user_email;
  const quickActions = preferences?.quick_actions || ['mood', 'water', 'food', 'note'];
  const customActions = preferences?.custom_quick_actions || [];

  // Load saved position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('quickActionsPosition');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPosition(parsed);
      } catch (e) {
        // Reset if invalid
        setPosition({ x: 0, y: 0 });
      }
    }
  }, []);

  // Save position to localStorage when it changes
  const savePosition = (newPos) => {
    setPosition(newPos);
    localStorage.setItem('quickActionsPosition', JSON.stringify(newPos));
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

  // Handle drag
  const handleDragStart = (e) => {
    setIsDragging(true);
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      dragRef.current.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleDrag = (e) => {
    if (!isDragging || !dragRef.current) return;
    e.preventDefault();
    
    const offset = dragRef.current.dragOffset || { x: 0, y: 0 };
    const newX = e.clientX - offset.x;
    const newY = e.clientY - offset.y;
    
    // Keep within viewport
    const maxX = window.innerWidth - (dragRef.current.offsetWidth || 200);
    const maxY = window.innerHeight - (dragRef.current.offsetHeight || 60);
    
    savePosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDrag);
      document.addEventListener('touchend', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDrag);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging]);

  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed right-4 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white"
        style={{ 
          top: '50%',
          transform: 'translateY(-50%)',
          background: `linear-gradient(135deg, ${primaryColor || '#1fd2ea'}, ${accentColor || '#bd84f5'})` 
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Zap className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <>
      {/* Floating Draggable Bar */}
      <motion.div
        ref={dragRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed z-50 flex items-center gap-1 bg-gray-900/95 backdrop-blur-sm rounded-full px-2 py-1.5 shadow-2xl"
        style={{
          left: position.x || 'calc(50% - 150px)',
          top: position.y || 16,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        {/* Drag handle */}
        <button
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className="p-1.5 cursor-grab active:cursor-grabbing hover:bg-white/10 rounded-full transition-colors"
          title="Drag to move"
        >
          <GripHorizontal className="w-4 h-4 text-gray-400" />
        </button>

        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-600 mx-1" />

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
                  className={`w-9 h-9 rounded-full ${action.color} flex items-center justify-center text-white hover:opacity-90 transition-all hover:scale-110`}
                  title={action.label}
                >
                  <Icon className="w-4 h-4" />
                </a>
              );
            }
            if (action.page) {
              return (
                <RouterLink
                  key={action.id}
                  to={createPageUrl(action.page)}
                  className={`w-9 h-9 rounded-full ${action.color} flex items-center justify-center text-white hover:opacity-90 transition-all hover:scale-110`}
                  title={action.label}
                >
                  <Icon className="w-4 h-4" />
                </RouterLink>
              );
            }
          }

          return (
            <motion.button
              key={action.id}
              onClick={() => handleAction(action.id)}
              className={`w-9 h-9 rounded-full ${action.color} flex items-center justify-center text-white hover:opacity-90 transition-all`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={action.label}
            >
              <Icon className="w-4 h-4" />
            </motion.button>
          );
        })}

        {/* Divider */}
        <div className="h-6 w-px bg-gray-600 mx-1" />

        {/* View notes & Settings */}
        <RouterLink
          to={createPageUrl('QuickNotes')}
          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          title="View saved notes"
        >
          <BookOpen className="w-4 h-4 text-gray-400 hover:text-white" />
        </RouterLink>
        <button
          onClick={() => {
            const settingsUrl = createPageUrl('Settings');
            window.location.href = settingsUrl;
            setTimeout(() => {
              const section = document.querySelector('[data-section="widgets"]');
              section?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4 text-gray-400 hover:text-white" />
        </button>
      </motion.div>

      {/* Mood Selector Popup */}
      <AnimatePresence>
        {activeAction === 'mood' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[60] bg-white rounded-2xl shadow-2xl p-4"
            style={{ 
              left: Math.min(position.x || window.innerWidth / 2, window.innerWidth - 280),
              top: (position.y || 16) + 60
            }}
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
        {['food', 'idea', 'negative_thought', 'note', 'gratitude'].includes(activeAction) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[60] bg-white rounded-2xl shadow-2xl p-4 w-80"
            style={{ 
              left: Math.min(position.x || window.innerWidth / 2, window.innerWidth - 340),
              top: (position.y || 16) + 60
            }}
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