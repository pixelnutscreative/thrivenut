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

const defaultMoodOptions = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'low', emoji: '😔', label: 'Low' },
  { value: 'anxious', emoji: '😰', label: 'Anxious' },
  { emoji: '😡', label: 'Angry', value: 'angry' },
  { emoji: '😢', label: 'Sad', value: 'sad' },
  { emoji: '🥰', label: 'Loved', value: 'loved' },
  { emoji: '💪', label: 'Motivated', value: 'motivated' },
  { emoji: '😴', label: 'Tired', value: 'tired' },
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
  const [showAddMoodInput, setShowAddMoodInput] = useState(false);
  const [customMoodInput, setCustomMoodInput] = useState({ emoji: '', label: '' });
  
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
  const [waterSuccess, setWaterSuccess] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ['waterToday'] });
      setWaterSuccess(true);
      setTimeout(() => setWaterSuccess(false), 2000);
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
      // If it's a negative thought, reframe it with AI
      if (data.type === 'negative_thought') {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Someone is having this negative thought: "${data.content}"\n\nPlease provide a kind, supportive reframe that helps them see this situation from a healthier perspective. Be empathetic and constructive. Keep it under 100 words.`,
        });
        return base44.entities.QuickNote.create({
          ...data,
          reframe: response
        });
      }
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

  const handleAddCustomMood = () => {
    if (!customMoodInput.emoji.trim() || !customMoodInput.label.trim()) return;
    moodLogMutation.mutate(customMoodInput.label.toLowerCase().replace(/\s+/g, '_'));
    setShowAddMoodInput(false);
    setCustomMoodInput({ emoji: '', label: '' });
  };

  // Get user's mood options
  const customMoods = preferences?.custom_mood_options || [];
  const topMoodValues = preferences?.top_mood_emojis || defaultMoodOptions.slice(0, 7).map(m => m.value);
  const allMoodOptions = [...defaultMoodOptions, ...customMoods];
  const moodOptions = allMoodOptions.filter(m => topMoodValues.includes(m.value));

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
              className={`w-9 h-9 rounded-full ${action.color} flex items-center justify-center text-white hover:opacity-90 transition-all relative`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={action.label}
            >
              <Icon className="w-4 h-4" />
              {action.id === 'water' && waterSuccess && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
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
            <div className="flex flex-wrap gap-2">
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
              
              {/* Add Custom Mood Button */}
              {!showAddMoodInput ? (
                <button
                  onClick={() => setShowAddMoodInput(true)}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-colors min-w-[60px]"
                >
                  <Plus className="w-5 h-5 text-gray-400" />
                  <span className="text-xs text-gray-500">Add</span>
                </button>
              ) : (
                <div className="w-full mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="😊"
                      value={customMoodInput.emoji}
                      onChange={(e) => setCustomMoodInput({ ...customMoodInput, emoji: e.target.value })}
                      className="w-16 text-center text-xl"
                      maxLength={2}
                      autoFocus
                    />
                    <Input
                      placeholder="Feeling name"
                      value={customMoodInput.label}
                      onChange={(e) => setCustomMoodInput({ ...customMoodInput, label: e.target.value })}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCustomMood();
                        if (e.key === 'Escape') setShowAddMoodInput(false);
                      }}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => { setShowAddMoodInput(false); setCustomMoodInput({ emoji: '', label: '' }); }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddCustomMood} disabled={!customMoodInput.emoji.trim() || !customMoodInput.label.trim()}>
                      Add
                    </Button>
                  </div>
                </div>
              )}
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
            {activeAction === 'negative_thought' && (
              <p className="text-xs text-purple-600 mb-2">
                ✨ AI will help you reframe this in a healthier way
              </p>
            )}
            <Button
              onClick={handleSubmitNote}
              disabled={!noteContent.trim() || quickNoteMutation.isPending}
              className="w-full"
              style={{ background: `linear-gradient(to right, ${primaryColor || '#1fd2ea'}, ${accentColor || '#bd84f5'})` }}
            >
              {quickNoteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {activeAction === 'negative_thought' ? 'Reframe with AI' : 'Save'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}