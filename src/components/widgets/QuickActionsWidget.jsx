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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import QuickEventAdder from '../dashboard/QuickEventAdder';

const builtInActions = [
  { id: 'mood', label: 'Mood', icon: Smile, color: 'bg-pink-500' },
  { id: 'water', label: 'Water', icon: Droplet, color: 'bg-blue-500' },
  { id: 'task', label: 'Quick Task', icon: CheckCircle, color: 'bg-teal-500' },
  { id: 'event', label: 'Add Event', icon: CalendarIcon, color: 'bg-orange-500' },
  { id: 'food', label: 'Food', icon: Utensils, color: 'bg-green-500' },
  { id: 'idea', label: 'Idea', icon: Lightbulb, color: 'bg-yellow-500' },
  { id: 'negative_thought', label: 'Reframe', icon: Cloud, color: 'bg-purple-500' },
  { id: 'note', label: 'Note', icon: StickyNote, color: 'bg-lime-500' },
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
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [activeAction, setActiveAction] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [showAddMoodInput, setShowAddMoodInput] = useState(false);
  const [customMoodInput, setCustomMoodInput] = useState({ emoji: '', label: '' });
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = useRef(null);
  const [moodNote, setMoodNote] = useState('');
  const [showQuickEventDialog, setShowQuickEventDialog] = useState(false);
  
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const userEmail = preferences?.user_email;
  const quickActions = preferences?.quick_actions || ['mood', 'water', 'food', 'note'];
  const customActions = preferences?.custom_quick_actions || [];

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
      setActiveAction('task');
    } else if (actionId === 'event') {
      setShowQuickEventDialog(true);
    } else {
      setActiveAction(actionId);
    }
  };

  const handleSubmitNote = async () => {
    if (!noteContent.trim()) return;
    
    if (activeAction === 'task') {
      // Create task instead of note
      await base44.entities.Task.create({
        title: noteContent,
        status: 'pending',
        priority: 'medium'
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setActiveAction(null);
      setNoteContent('');
    } else {
      quickNoteMutation.mutate({
        type: activeAction,
        content: noteContent
      });
    }
  };

  const handleMoodSelect = (mood) => {
    moodLogMutation.mutate({ mood, note: moodNote });
    setMoodNote(''); // Reset note after submission
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
    {/* Fixed Top Bar */}
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed z-40 backdrop-blur-sm px-2 py-1.5 shadow-2xl"
      style={{
        left: isMobile ? 0 : '288px',
        right: 0,
        top: isMobile ? '56px' : '0',
        width: isMobile ? '100%' : 'calc(100% - 288px)',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4px',
        borderRadius: isMobile ? '0 0 12px 12px' : '0 0 12px 0',
        backgroundColor: 'rgba(75, 85, 99, 0.95)',
      }}
    >
        {/* Main action bar */}
        <div className="flex items-center gap-1">

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
            maxWidth: 'calc(100vw - 200px)'
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
              const meals = ['breakfast', 'lunch', 'dinner'];
              const mealTimes = {
                breakfast: { start: 5, end: 11 },
                lunch: { start: 11, end: 16 },
                dinner: { start: 16, end: 24 }
              };

              // Check which meals have been logged
              const loggedMeals = meals.filter(meal => {
                return foodNotes.some(note => {
                  const noteTime = new Date(note.created_date).getHours();
                  return noteTime >= mealTimes[meal].start && noteTime < mealTimes[meal].end;
                });
              });

              const mealsCompleted = loggedMeals.length;
              const allMealsLogged = mealsCompleted === 3;

              if (allMealsLogged) {
                displayContent = '✓';
                showIcon = false;
              } else {
                displayContent = `${mealsCompleted}/3`;
                showIcon = false;
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

            // Determine button styling based on action type
            let buttonClass = `w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-all relative overflow-hidden`;
            let buttonStyle = {};

            if (action.id === 'food') {
              const mealsCompleted = parseInt(displayContent?.split('/')[0]) || 0;
              if (mealsCompleted === 0) {
                buttonStyle = { background: 'linear-gradient(to right, #ef4444, #dc2626)' }; // Red gradient - no meals
              } else if (mealsCompleted === 1) {
                buttonStyle = { background: 'linear-gradient(to right, #f59e0b, #d97706)' }; // Orange gradient - 1 meal
              } else if (mealsCompleted === 2) {
                buttonStyle = { background: 'linear-gradient(to right, #eab308, #ca8a04)' }; // Yellow gradient - 2 meals
              } else {
                buttonStyle = { background: 'linear-gradient(to right, #22c55e, #16a34a)' }; // Green gradient - all meals
              }
            } else {
              buttonClass += ` ${action.color}`;
            }

            return (
              <motion.button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className={buttonClass}
                style={buttonStyle}
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
          onClick={() => window.location.href = createPageUrl('Settings') + '#widgets'}
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
              left: isMobile ? '50%' : '320px',
              transform: isMobile ? 'translateX(-50%)' : 'none',
              top: isMobile ? '120px' : '60px'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">How are you feeling?</h3>
              <button onClick={() => { setActiveAction(null); setMoodNote(''); }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => handleMoodSelect(mood.value)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-purple-100 transition-colors border-2 border-transparent hover:border-purple-400"
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
              <label className="text-xs text-gray-600 mb-1 block">Why do you feel this way? (optional)</label>
              <Input
                placeholder="e.g., Had a great call, stressful meeting..."
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                className="text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setActiveAction(null);
                    setMoodNote('');
                  }
                }}
              />
              <p className="text-xs text-purple-600 mt-2 font-medium">👆 Type your reason first, then click an emoji above to log it</p>
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
              left: isMobile ? '50%' : '320px',
              transform: isMobile ? 'translateX(-50%)' : 'none',
              top: isMobile ? '120px' : '60px'
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