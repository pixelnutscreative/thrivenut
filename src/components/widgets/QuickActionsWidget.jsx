import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { 
  Zap, Droplet, Smile, Utensils, Lightbulb, Cloud, StickyNote, 
  X, Check, Settings, Music, Heart, Home, Link, ExternalLink, GripHorizontal, BookOpen, Loader2, ChevronDown, ChevronRight, ChevronLeft, Calendar as CalendarIcon, CheckCircle, Sun, Sunrise, Sunset
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import QuickEventAdder from '../dashboard/QuickEventAdder';

const builtInActions = [
  { id: 'mood', label: 'Mood', icon: Smile, color: 'bg-pink-500' },
  { id: 'water', label: 'Water', icon: Droplet, color: 'bg-cyan-500' },
  { id: 'task', label: 'Task', icon: CheckCircle, color: 'bg-teal-500' },
  { id: 'event', label: 'Event', icon: CalendarIcon, color: 'bg-orange-500' },
  { id: 'food', label: 'Food', icon: Utensils, color: 'bg-green-500' },
  { id: 'idea', label: 'Idea', icon: Lightbulb, color: 'bg-yellow-500' },
  { id: 'negative_thought', label: 'Reframe', icon: Cloud, color: 'bg-gray-500' },
  { id: 'note', label: 'Note', icon: StickyNote, color: 'bg-purple-500' },
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

const iconMap = { Smile, Droplet, Utensils, Lightbulb, Cloud, StickyNote, Heart, Home, Music, Zap, Link, ExternalLink, Check, CheckCircle, Calendar: CalendarIcon };

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
  const [musicMinimized, setMusicMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef(null);
  const [moodNote, setMoodNote] = useState('');
  const [showQuickEventDialog, setShowQuickEventDialog] = useState(false);
  
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // If mobile and no position set, default to top right under header
      if (mobile) {
        setPosition({ x: window.innerWidth - 60, y: 70 });
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const userEmail = preferences?.user_email;
  const quickActions = preferences?.quick_actions || ['mood', 'water', 'food', 'note'];
  const customActions = preferences?.custom_quick_actions || [];
  const [isDocked, setIsDocked] = useState(true); // Desktop docked by default

  // Fetch today's data for displaying counts
  const { data: todaysWater } = useQuery({
    queryKey: ['waterToday', today, userEmail],
    queryFn: async () => {
      const logs = await base44.entities.WaterLog.filter({ date: today, created_by: userEmail });
      return logs[0] || null;
    },
    enabled: !!userEmail,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: todaysMoodLogs = [] } = useQuery({
    queryKey: ['moodToday', today, userEmail],
    queryFn: async () => {
      return await base44.entities.MoodLog.filter({ date: today, created_by: userEmail });
    },
    enabled: !!userEmail,
    refetchInterval: 10000,
  });

  const { data: todaysNotes = [] } = useQuery({
    queryKey: ['quickNotesToday', today, userEmail],
    queryFn: async () => {
      return await base44.entities.QuickNote.filter({ date: today, created_by: userEmail });
    },
    enabled: !!userEmail,
    refetchInterval: 10000,
  });

  // Calculate counts by type
  const noteCounts = {
    food: todaysNotes.filter(n => n.type === 'food').length,
    idea: todaysNotes.filter(n => n.type === 'idea').length,
    gratitude: todaysNotes.filter(n => n.type === 'gratitude').length,
    note: todaysNotes.filter(n => n.type === 'note').length,
    negative_thought: todaysNotes.filter(n => n.type === 'negative_thought').length,
  };

  const latestMood = todaysMoodLogs.length > 0 ? todaysMoodLogs[todaysMoodLogs.length - 1] : null;

  // Load saved position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('quickActionsPosition');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Fix for widget stuck at top - ensure it's not covering header
        if (parsed.y < 80) {
           parsed.y = window.innerHeight - 120;
        }
        setPosition(parsed);
      } catch (e) {
        // Reset if invalid - default to bottom
        setPosition({ x: 0, y: window.innerHeight - 120 });
      }
    } else {
      // Default to bottom for new users
      setPosition({ x: 0, y: window.innerHeight - 120 });
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
      queryClient.invalidateQueries({ queryKey: ['waterToday', today, userEmail] });
      setWaterSuccess(true);
      setTimeout(() => setWaterSuccess(false), 2000);
      setActiveAction(null);
    }
  });

  const moodLogMutation = useMutation({
    mutationFn: async ({ mood, note }) => {
      return base44.entities.MoodLog.create({ 
        date: today, 
        mood,
        time: format(new Date(), 'HH:mm'),
        note: note || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moodLog'] });
      queryClient.invalidateQueries({ queryKey: ['moodToday'] });
      queryClient.invalidateQueries({ queryKey: ['moodToday', today, userEmail] });
      setActiveAction(null);
      setMoodNote('');
    }
  });

  const quickNoteMutation = useMutation({
    mutationFn: async (data) => {
      // If it's a negative thought, reframe it with AI
      if (data.type === 'negative_thought') {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Someone is having this negative thought: "${data.content}"\n\nProvide a supportive biblical reframe that helps them see this differently. Address common struggles like complaining, unforgiveness, or negativity. If they mention unforgiveness, remind them to pray blessings for that person - it's not for the other person (who may never know or care), it's so they can move forward without holding onto that poison, and put their eyes back on Jesus. Be empathetic, constructive, and Christ-centered. Keep it under 150 words.`,
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
      queryClient.invalidateQueries({ queryKey: ['quickNotesToday'] });
      queryClient.invalidateQueries({ queryKey: ['quickNotesToday', today, userEmail] });
      setActiveAction(null);
      setNoteContent('');
    }
  });

  const handleAction = (actionId) => {
    if (actionId === 'water') {
      waterLogMutation.mutate();
    } else if (actionId === 'task') {
      window.location.href = createPageUrl('Tasks');
    } else if (actionId === 'event') {
      setShowQuickEventDialog(true);
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
    moodLogMutation.mutate({ mood, note: moodNote });
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

  // Get all visible actions (built-in + custom) - no limit
  const getVisibleActions = () => {
    const actions = [];
    const overrides = preferences?.action_overrides || {};
    
    quickActions.forEach(id => {
      const builtIn = builtInActions.find(a => a.id === id);
      if (builtIn) {
        // Apply overrides for label and color
        const override = overrides[id] || {};
        actions.push({
          ...builtIn,
          label: override.label || builtIn.label,
          color: override.color || builtIn.color
        });
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

  // Scroll handling for action carousel
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

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
            className="fixed z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white"
            style={{ 
              right: '16px',
              top: isMobile ? '70px' : '80px',
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
    {/* Floating/Docked Bar */}
    <motion.div
      ref={dragRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed z-50 backdrop-blur-sm rounded-full px-2 py-1.5 shadow-2xl"
      style={{
        // Docked to top below header on both mobile and desktop
        left: (isMobile || isDocked) ? 0 : (position.x || 'calc(50% - 150px)'),
        right: (isMobile || isDocked) ? 0 : 'auto',
        top: (isMobile || isDocked) ? '56px' : (position.y || 80),
        width: (isMobile || isDocked) ? '100%' : 'auto',
        cursor: (!isMobile && !isDocked && isDragging) ? 'grabbing' : 'default',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4px',
        maxWidth: '100%',
        overflowX: 'auto',
        borderRadius: (isMobile || isDocked) ? '0 0 12px 12px' : '9999px',
        backgroundColor: 'rgba(75, 85, 99, 0.95)', // Lighter gray (gray-600)
      }}
    >
        {/* Main action bar */}
        <div className="flex items-center gap-1">
        {/* Pin/Unpin button - Desktop only */}
        {!isMobile && (
          <button
            onClick={() => setIsDocked(!isDocked)}
            onMouseDown={(e) => isDocked ? null : handleDragStart(e)}
            onTouchStart={(e) => isDocked ? null : handleDragStart(e)}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            style={{ cursor: isDocked ? 'pointer' : 'grab' }}
            title={isDocked ? "Detach to drag" : "Drag to move"}
          >
            {isDocked ? <GripHorizontal className="w-4 h-4 text-gray-300" /> : <GripHorizontal className="w-4 h-4 text-gray-400" />}
          </button>
        )}

        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-300" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-600 mx-1" />

        {/* Scroll Left Button */}
        {visibleActions.length > 7 && (
          <button
            onClick={scrollLeft}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-gray-300" />
          </button>
        )}

        {/* Scrollable Action buttons container */}
        <div 
          ref={scrollContainerRef}
          className="flex items-center gap-1"
          style={{ 
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            maxWidth: (isMobile || isDocked) ? 'calc(100vw - 200px)' : '600px'
          }}
        >
          {visibleActions.map((action) => {
            const Icon = action.icon;

            // Get count/display data for this action
            let displayContent = null;
            let showIcon = true;
            let mealTimeIcon = null;

            if (action.id === 'water') {
              const waterCount = todaysWater?.glasses || 0;
              if (waterCount > 0) {
                displayContent = (
                  <div className="relative">
                    <Droplet className="w-4 h-4 text-white fill-white" />
                    <span className="absolute -top-1 -right-1 text-[10px] font-bold text-white bg-blue-600 rounded-full w-3 h-3 flex items-center justify-center">
                      {waterCount}
                    </span>
                  </div>
                );
                showIcon = false;
              }
            } else if (action.id === 'mood') {
              if (latestMood) {
                const moodEmoji = allMoodOptions.find(m => m.value === latestMood.mood)?.emoji || '😊';
                displayContent = moodEmoji;
                showIcon = false;
              }
            } else if (action.id === 'food') {
              // Determine meal time based on current hour and what's been logged
              const now = new Date();
              const hour = now.getHours();
              const foodNotes = todaysNotes.filter(n => n.type === 'food');

              // Meal time logic: breakfast (5-11), lunch (11-16), dinner (16-23)
              let currentMeal = 'breakfast';
              if (hour >= 11 && hour < 16) currentMeal = 'lunch';
              else if (hour >= 16) currentMeal = 'dinner';

              // Check if current meal already logged
              const mealLogged = foodNotes.some(note => {
                const noteTime = new Date(note.created_date).getHours();
                if (currentMeal === 'breakfast' && noteTime >= 5 && noteTime < 11) return true;
                if (currentMeal === 'lunch' && noteTime >= 11 && noteTime < 16) return true;
                if (currentMeal === 'dinner' && noteTime >= 16) return true;
                return false;
              });

              if (mealLogged) {
                displayContent = foodNotes.length;
                showIcon = false;
              } else {
                // Show meal time indicator
                if (currentMeal === 'breakfast') {
                  mealTimeIcon = <Sunrise className="absolute inset-0 w-9 h-9 text-orange-300 opacity-30" />;
                } else if (currentMeal === 'lunch') {
                  mealTimeIcon = <Sun className="absolute inset-0 w-9 h-9 text-yellow-300 opacity-30" />;
                } else {
                  mealTimeIcon = <Sunset className="absolute inset-0 w-9 h-9 text-purple-300 opacity-30" />;
                }
              }
            } else if (noteCounts[action.id] > 0) {
              displayContent = noteCounts[action.id];
              showIcon = false;
            }
            
            // Handle custom actions with page/external links
            if (action.isCustom) {
              if (action.external_url) {
                return (
                  <a
                    key={action.id}
                    href={action.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-9 h-9 flex-shrink-0 rounded-full ${action.color} flex items-center justify-center text-white hover:opacity-90 transition-all hover:scale-110`}
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
                    className={`w-9 h-9 flex-shrink-0 rounded-full ${action.color} flex items-center justify-center text-white hover:opacity-90 transition-all hover:scale-110`}
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
                className={`w-9 h-9 flex-shrink-0 rounded-full ${action.color} flex items-center justify-center text-white hover:opacity-90 transition-all relative overflow-hidden`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={action.label}
              >
                {mealTimeIcon}
                {showIcon ? (
                  <Icon className="w-4 h-4 relative z-10" />
                ) : (
                  <span className="text-lg font-bold relative z-10">
                    {displayContent}
                  </span>
                )}
                {action.id === 'water' && waterSuccess && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 bg-green-500 rounded-full flex items-center justify-center z-20"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
        
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Scroll Right Button */}
        {visibleActions.length > 7 && (
          <button
            onClick={scrollRight}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        )}

        {/* Divider */}
        <div className="h-6 w-px bg-gray-600 mx-1" />

        {/* View notes */}
        <RouterLink
          to={createPageUrl('QuickNotes')}
          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          title="View saved notes"
        >
          <BookOpen className="w-4 h-4 text-gray-300 hover:text-white" />
        </RouterLink>

        {/* Settings */}
        <button
          onClick={() => window.location.href = `${createPageUrl('Settings')}#widgets`}
          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          title="Widget Settings"
        >
          <Settings className="w-4 h-4 text-gray-300 hover:text-white" />
        </button>
        </div>

        {/* SoundCloud Player - Removed from here, use dedicated player setting */}
      </motion.div>

      {/* Mood Selector Popup */}
      <AnimatePresence>
        {activeAction === 'mood' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[60] bg-white rounded-2xl shadow-2xl p-4 max-w-sm"
            style={{ 
              right: '80px',
              top: (position.y || 80)
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">How are you feeling?</h3>
              <button onClick={() => { setActiveAction(null); setMoodNote(''); }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => handleMoodSelect(mood.value)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                  disabled={moodLogMutation.isPending}
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

              {/* Optional mood note */}
              <div className="border-t pt-3 mt-3">
              <label className="text-xs text-gray-600 mb-1 block">Why? (optional)</label>
              <Input
                placeholder="e.g., Had a great call, stressful meeting..."
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setActiveAction(null);
                    setMoodNote('');
                  }
                }}
              />
              <p className="text-xs text-gray-400 mt-1">Press any mood emoji above to log</p>
              </div>
              </motion.div>
              )}
              </AnimatePresence>

      {/* Note Input Popup */}
      <AnimatePresence>
        {['food', 'idea', 'negative_thought', 'note', 'gratitude', 'task'].includes(activeAction) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[60] bg-white rounded-2xl shadow-2xl p-4 w-80"
            style={{ 
              right: '80px',
              top: (position.y || 16)
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">
                {activeAction === 'food' && '🍽️ Log Food'}
                {activeAction === 'idea' && '💡 Capture Idea'}
                {activeAction === 'negative_thought' && '☁️ Reframe Thought'}
                {activeAction === 'note' && '📝 Quick Note'}
                {activeAction === 'gratitude' && '❤️ Gratitude'}
                {activeAction === 'task' && '✅ Quick Task'}
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
                activeAction === 'task' ? 'What do you need to do?' :
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

      {/* Quick Event Dialog */}
      <QuickEventAdder 
        isOpen={showQuickEventDialog}
        onClose={() => setShowQuickEventDialog(false)}
        userEmail={userEmail}
      />
      </>
      );
      }