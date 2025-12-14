import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Zap, Droplet, Smile, Utensils, Lightbulb, Cloud, StickyNote, Heart, Home, Music, Link, ExternalLink,
  CheckCircle, Calendar, Mail, Phone, MessageSquare, Send, Inbox, Star, Bookmark, Flag, Bell, Gift,
  ShoppingCart, ShoppingBag, CreditCard, DollarSign, Target, Trophy, Award, TrendingUp, Activity,
  BarChart, PieChart, LineChart, Users, User, UserPlus, UserCheck, Camera, Video, Film, Image, Tv,
  Headphones, Coffee, Pizza, Apple, Sandwich, Cookie, Beer, Book, BookOpen, FileText, File, Folder,
  FolderOpen, Archive, Clipboard, Edit, PenTool, Feather, Palette, Paintbrush, Scissors, Copy, Save,
  Download, Upload, Share, Share2, Globe, MapPin, Map, Navigation, Compass, Plane, Car, Bus, Briefcase,
  Package, Tag, Hash, AtSign, Percent, CloudRain, Sun, Moon, CloudSnow, Umbrella, Wind, Thermometer,
  Droplets, Waves, Mountain, Trees, Leaf, Flower, Sparkles, Flame, Battery, BatteryCharging, Bluetooth,
  Wifi, Radio, Signal, Lock, Unlock, Key, Shield, Eye, EyeOff, Search, Filter, Settings, Sliders, Volume,
  Volume2, VolumeX, Mic, MicOff, Play, Pause, SkipForward, SkipBack, FastForward, Rewind, Repeat, Shuffle,
  Clock, Timer, Hourglass, Watch, AlarmClock, Sunrise, Sunset, Cat, Dog, Fish, Bike, Dumbbell, Footprints,
  Hand, ThumbsUp, ThumbsDown, Laugh, Angry, Frown, Brain, Pill, Cross, Plus, Minus, X, Check, Anchor,
  Rocket, Ship, Train, Truck, Building, Store, Factory, Tent, PawPrint, Bone, Gamepad, Monitor, Laptop,
  Smartphone, Tablet, Printer, Keyboard, Mouse, Megaphone, Speaker, Podcast, Instagram, Twitter, Facebook,
  Youtube, Linkedin, Github, Chrome, Command, Code, Terminal, Database, Server, HardDrive, CloudUpload,
  Wallet, Coins, Banknote, Receipt, Calculator, Landmark, PiggyBank, Hammer, Wrench, Brush, Ruler, Sword,
  ChevronLeft, ChevronRight, Loader2, MonitorPlay, Menu as MenuIcon, EyeOff, GripVertical, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import QuickEventAdder from '../dashboard/QuickEventAdder';

const iconMap = {
  Zap, Droplet, Smile, Utensils, Lightbulb, Cloud, StickyNote, Heart, Home, Music, Link, ExternalLink,
  CheckCircle, Calendar, Mail, Phone, MessageSquare, Send, Inbox, Star, Bookmark, Flag, Bell, Gift,
  ShoppingCart, ShoppingBag, CreditCard, DollarSign, Target, Trophy, Award, TrendingUp, Activity,
  BarChart, PieChart, LineChart, Users, User, UserPlus, UserCheck, Camera, Video, Film, Image, Tv,
  Headphones, Coffee, Pizza, Apple, Sandwich, Cookie, Beer, Book, BookOpen, FileText, File, Folder,
  FolderOpen, Archive, Clipboard, Edit, PenTool, Feather, Palette, Paintbrush, Scissors, Copy, Save,
  Download, Upload, Share, Share2, Globe, MapPin, Map, Navigation, Compass, Plane, Car, Bus, Briefcase,
  Package, Tag, Hash, AtSign, Percent, CloudRain, Sun, Moon, CloudSnow, Umbrella, Wind, Thermometer,
  Droplets, Waves, Mountain, Trees, Leaf, Flower, Sparkles, Flame, Battery, BatteryCharging, Bluetooth,
  Wifi, Radio, Signal, Lock, Unlock, Key, Shield, Eye, EyeOff, Search, Filter, Settings, Sliders, Volume,
  Volume2, VolumeX, Mic, MicOff, Play, Pause, SkipForward, SkipBack, FastForward, Rewind, Repeat, Shuffle,
  Clock, Timer, Hourglass, Watch, AlarmClock, Sunrise, Sunset, Cat, Dog, Fish, Bike, Dumbbell, Footprints,
  Hand, ThumbsUp, ThumbsDown, Laugh, Angry, Frown, Brain, Pill, Cross, Plus, Minus, Check, Anchor,
  Rocket, Ship, Train, Truck, Building, Store, Factory, Tent, PawPrint, Bone, Gamepad, Monitor, Laptop,
  Smartphone, Tablet, Printer, Keyboard, Mouse, Megaphone, Speaker, Podcast, Instagram, Twitter, Facebook,
  Youtube, Linkedin, Github, Chrome, Command, Code, Terminal, Database, Server, HardDrive, CloudUpload,
  Wallet, Coins, Banknote, Receipt, Calculator, Landmark, PiggyBank, Hammer, Wrench, Brush, Ruler, Sword
};

const builtInActions = [
  { id: 'mood', label: 'Mood', icon: 'Smile', color: 'bg-pink-500' },
  { id: 'water', label: 'Water', icon: 'Droplet', color: 'bg-blue-500' },
  { id: 'task', label: 'Quick Task', icon: 'CheckCircle', color: 'bg-teal-500' },
  { id: 'event', label: 'Add Event', icon: 'Calendar', color: 'bg-orange-500' },
  { id: 'food', label: 'Food', icon: 'Utensils', color: 'bg-green-500' },
  { id: 'idea', label: 'Idea', icon: 'Lightbulb', color: 'bg-yellow-500' },
  { id: 'negative_thought', label: 'Reframe', icon: 'Cloud', color: 'bg-purple-500' },
  { id: 'note', label: 'Note', icon: 'StickyNote', color: 'bg-lime-500' },
  { id: 'gratitude', label: 'Gratitude', icon: 'Heart', color: 'bg-red-500' },
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

export default function QuickActionsBarV2({ preferences, primaryColor, accentColor }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(true);
  const [activeAction, setActiveAction] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = useRef(null);
  const [moodNote, setMoodNote] = useState('');
  const [showQuickEventDialog, setShowQuickEventDialog] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const userEmail = preferences?.user_email;
  const quickActions = preferences?.quick_actions || ['mood', 'water', 'food', 'note'];
  const customActions = preferences?.custom_quick_actions || [];
  const barColor = preferences?.quick_actions_bar_color || 'rgba(75, 85, 99, 0.95)';

  const { data: todaysWater } = useQuery({
    queryKey: ['waterToday', today, userEmail],
    queryFn: async () => {
      const logs = await base44.entities.WaterLog.filter({ date: today, created_by: userEmail });
      return logs[0] || null;
    },
    enabled: !!userEmail,
    refetchInterval: 10000,
  });

  const { data: todaysMoodLogs = [] } = useQuery({
    queryKey: ['moodToday', today, userEmail],
    queryFn: () => base44.entities.MoodLog.filter({ date: today, created_by: userEmail }),
    enabled: !!userEmail,
    refetchInterval: 10000,
  });

  const { data: todaysNotes = [] } = useQuery({
    queryKey: ['quickNotesToday', today, userEmail],
    queryFn: () => base44.entities.QuickNote.filter({ date: today, created_by: userEmail }),
    enabled: !!userEmail,
    refetchInterval: 10000,
  });

  const noteCounts = {
    food: todaysNotes.filter(n => n.type === 'food').length,
    idea: todaysNotes.filter(n => n.type === 'idea').length,
    gratitude: todaysNotes.filter(n => n.type === 'gratitude').length,
    note: todaysNotes.filter(n => n.type === 'note').length,
    negative_thought: todaysNotes.filter(n => n.type === 'negative_thought').length,
  };

  const latestMood = todaysMoodLogs[todaysMoodLogs.length - 1] || null;
  const [waterSuccess, setWaterSuccess] = useState(false);

  const waterLogMutation = useMutation({
    mutationFn: async () => {
      const existing = await base44.entities.WaterLog.filter({ date: today, created_by: userEmail });
      if (existing[0]) {
        return base44.entities.WaterLog.update(existing[0].id, { glasses: (existing[0].glasses || 0) + 1 });
      }
      return base44.entities.WaterLog.create({ date: today, glasses: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterToday'] });
      setWaterSuccess(true);
      setTimeout(() => setWaterSuccess(false), 2000);
      setActiveAction(null);
    }
  });

  const moodLogMutation = useMutation({
    mutationFn: ({ mood, note }) => base44.entities.MoodLog.create({ date: today, mood, time: format(new Date(), 'HH:mm'), note: note || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moodToday'] });
      setActiveAction(null);
      setMoodNote('');
    }
  });

  const quickNoteMutation = useMutation({
    mutationFn: async (data) => {
      if (data.type === 'negative_thought') {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Someone is having this negative thought: "${data.content}"\n\nProvide a supportive biblical reframe. Be empathetic and Christ-centered. Keep it under 150 words.`,
        });
        return base44.entities.QuickNote.create({ ...data, reframe: response });
      }
      return base44.entities.QuickNote.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickNotesToday'] });
      setActiveAction(null);
      setNoteContent('');
    }
  });

  const handleAction = (actionId) => {
    if (actionId === 'water') waterLogMutation.mutate();
    else if (actionId === 'task') setActiveAction('task');
    else if (actionId === 'event') setShowQuickEventDialog(true);
    else setActiveAction(actionId);
  };

  const handleSubmitNote = async () => {
    if (!noteContent.trim()) return;
    if (activeAction === 'task') {
      await base44.entities.Task.create({ title: noteContent, status: 'pending', priority: 'medium' });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setActiveAction(null);
      setNoteContent('');
    } else {
      quickNoteMutation.mutate({ type: activeAction, content: noteContent });
    }
  };

  const handleMoodSelect = (mood) => {
    moodLogMutation.mutate({ mood, note: moodNote });
  };

  const customMoods = preferences?.custom_mood_options || [];
  const topMoodValues = preferences?.top_mood_emojis || defaultMoodOptions.slice(0, 7).map(m => m.value);
  const allMoodOptions = [...defaultMoodOptions, ...customMoods];
  const moodOptions = allMoodOptions.filter(m => topMoodValues.includes(m.value));

  const getVisibleActions = () => {
    const actions = [];
    const overrides = preferences?.action_overrides || {};
    
    quickActions.forEach(id => {
      const builtIn = builtInActions.find(a => a.id === id);
      if (builtIn) {
        const override = overrides[id] || {};
        actions.push({
          ...builtIn,
          label: override.label || builtIn.label,
          color: override.color || builtIn.color
        });
      } else {
        const custom = customActions.find(a => a.id === id);
        if (custom) actions.push({ ...custom, isCustom: true });
      }
    });
    return actions;
  };

  const visibleActions = getVisibleActions();
  const getIcon = (iconName) => iconMap[iconName] || Zap;

  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white"
        style={{ right: '16px', top: isMobile ? '70px' : '80px', background: `linear-gradient(135deg, ${primaryColor || '#1fd2ea'}, ${accentColor || '#bd84f5'})` }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Zap className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed z-[44] backdrop-blur-sm px-2 py-1.5 shadow-2xl"
        id="quick-actions-bar"
        style={{
          top: isMobile ? '56px' : '0',
          left: isMobile ? 0 : '288px',
          right: 0,
          width: isMobile ? '100%' : 'calc(100% - 288px)',
          borderRadius: isMobile ? '0 0 12px 12px' : '0 0 12px 0',
          backgroundColor: barColor,
        }}
      >
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-4 h-4 text-gray-300" />
          </button>
          <div className="h-6 w-px bg-gray-600 mx-1" />
          {visibleActions.length > 7 && (
            <button onClick={() => scrollContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' })} className="p-1.5 hover:bg-white/10 rounded-full">
              <ChevronLeft className="w-4 h-4 text-gray-300" />
            </button>
          )}
          <div ref={scrollContainerRef} className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', maxWidth: 'calc(100vw - 200px)' }}>
            {visibleActions.map((action) => {
              const Icon = getIcon(action.icon);
              let displayContent = null;
              let showIcon = true;

              if (action.id === 'water') {
                const waterCount = todaysWater?.glasses || 0;
                if (waterCount > 0) {
                  displayContent = <div className="relative"><Droplet className="w-4 h-4 text-white fill-white" /><span className="absolute -top-1 -right-1 text-[10px] font-bold text-white bg-blue-600 rounded-full w-3 h-3 flex items-center justify-center">{waterCount}</span></div>;
                  showIcon = false;
                }
              } else if (action.id === 'mood' && latestMood) {
                displayContent = allMoodOptions.find(m => m.value === latestMood.mood)?.emoji || '😊';
                showIcon = false;
              } else if (action.id === 'food') {
                const foodNotes = todaysNotes.filter(n => n.type === 'food');
                const mealTimes = { breakfast: { start: 5, end: 11 }, lunch: { start: 11, end: 16 }, dinner: { start: 16, end: 24 } };
                const loggedMeals = ['breakfast', 'lunch', 'dinner'].filter(meal => {
                  return foodNotes.some(note => {
                    const noteTime = new Date(note.created_date).getHours();
                    return noteTime >= mealTimes[meal].start && noteTime < mealTimes[meal].end;
                  });
                });
                const mealsCompleted = loggedMeals.length;
                displayContent = mealsCompleted === 3 ? '✓' : `${mealsCompleted}/3`;
                showIcon = false;
              } else if (noteCounts[action.id] > 0) {
                displayContent = noteCounts[action.id];
                showIcon = false;
              }

              if (action.isCustom) {
                if (action.external_url) {
                  return (
                    <a key={action.id} href={action.external_url} target="_blank" rel="noopener noreferrer" className={`w-9 h-9 flex-shrink-0 rounded-full ${action.color} flex items-center justify-center text-white hover:opacity-90 hover:scale-110`} title={action.label}>
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                }
                if (action.page) {
                  return (
                    <RouterLink key={action.id} to={createPageUrl(action.page)} className={`w-9 h-9 flex-shrink-0 rounded-full ${action.color} flex items-center justify-center text-white hover:opacity-90 hover:scale-110`} title={action.label}>
                      <Icon className="w-4 h-4" />
                    </RouterLink>
                  );
                }
              }

              let buttonStyle = {};
              if (action.id === 'food') {
                const mealsCompleted = parseInt(displayContent?.split('/')[0]) || 0;
                buttonStyle = mealsCompleted === 0 ? { background: 'linear-gradient(to right, #ef4444, #dc2626)' } :
                              mealsCompleted === 1 ? { background: 'linear-gradient(to right, #f59e0b, #d97706)' } :
                              mealsCompleted === 2 ? { background: 'linear-gradient(to right, #eab308, #ca8a04)' } :
                              { background: 'linear-gradient(to right, #22c55e, #16a34a)' };
              }

              return (
                <motion.button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-all relative ${action.id !== 'food' ? action.color : ''}`}
                  style={buttonStyle}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title={action.label}
                >
                  {showIcon ? <Icon className="w-4 h-4 relative z-10" /> : <span className="text-lg font-bold relative z-10">{displayContent}</span>}
                  {action.id === 'water' && waterSuccess && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 bg-green-500 rounded-full flex items-center justify-center z-20">
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
          {visibleActions.length > 7 && (
            <button onClick={() => scrollContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' })} className="p-1.5 hover:bg-white/10 rounded-full">
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          )}
          <div className="h-6 w-px bg-gray-600 mx-1" />
          <RouterLink to={createPageUrl('QuickNotes')} className="p-1.5 hover:bg-white/10 rounded-full transition-colors" title="View saved notes">
            <BookOpen className="w-4 h-4 text-gray-300 hover:text-white" />
          </RouterLink>
          <button onClick={() => window.location.href = createPageUrl('Settings') + '#widgets-v2'} className="p-1.5 hover:bg-white/10 rounded-full transition-colors" title="Widget Settings">
            <Settings className="w-4 h-4 text-gray-300 hover:text-white" />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {activeAction === 'mood' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed z-[60] bg-white rounded-2xl shadow-2xl p-4 max-w-sm" style={{ left: isMobile ? '50%' : '320px', transform: isMobile ? 'translateX(-50%)' : 'none', top: isMobile ? '120px' : '60px' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">How are you feeling?</h3>
              <button onClick={() => { setActiveAction(null); setMoodNote(''); }} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {moodOptions.map((mood) => (
                <button key={mood.value} onClick={() => handleMoodSelect(mood.value)} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-purple-100 border-2 border-transparent hover:border-purple-400" disabled={moodLogMutation.isPending}>
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs text-gray-600">{mood.label}</span>
                </button>
              ))}
            </div>
            <div className="border-t pt-3">
              <label className="text-xs text-gray-600 mb-1 block">Why? (optional)</label>
              <Input placeholder="Had a great call..." value={moodNote} onChange={(e) => setMoodNote(e.target.value)} className="text-sm" />
              <p className="text-xs text-purple-600 mt-2">👆 Type reason, then click emoji</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {['food', 'idea', 'negative_thought', 'note', 'gratitude', 'task'].includes(activeAction) && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed z-[60] bg-white rounded-2xl shadow-2xl p-4 w-80" style={{ left: isMobile ? '50%' : '320px', transform: isMobile ? 'translateX(-50%)' : 'none', top: isMobile ? '120px' : '60px' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">
                {activeAction === 'food' && '🍽️ Log Food'}
                {activeAction === 'idea' && '💡 Idea'}
                {activeAction === 'negative_thought' && '☁️ Reframe'}
                {activeAction === 'note' && '📝 Note'}
                {activeAction === 'gratitude' && '❤️ Gratitude'}
                {activeAction === 'task' && '✅ Task'}
              </h3>
              <button onClick={() => setActiveAction(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
            </div>
            <Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder={activeAction === 'food' ? 'What did you eat?' : activeAction === 'idea' ? 'Your idea?' : activeAction === 'negative_thought' ? 'Negative thought?' : activeAction === 'gratitude' ? 'Grateful for?' : activeAction === 'task' ? 'To do?' : 'Write...'} className="min-h-[80px] mb-3" autoFocus />
            {activeAction === 'negative_thought' && <p className="text-xs text-purple-600 mb-2">✨ AI will reframe</p>}
            <Button onClick={handleSubmitNote} disabled={!noteContent.trim() || quickNoteMutation.isPending} className="w-full" style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}>
              {quickNoteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              {activeAction === 'negative_thought' ? 'Reframe' : 'Save'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <QuickEventAdder isOpen={showQuickEventDialog} onClose={() => setShowQuickEventDialog(false)} userEmail={userEmail} />
    </>
  );
}